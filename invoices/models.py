from decimal import Decimal
from django.db import models, transaction
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import Contact, Store, Safe, Representative, Driver, Bank
from products.models import Product, ProductUnit
from finances.models import SafeTransaction, ContactTransaction

class Invoice(models.Model):
    SALE = 'sale'
    PURCHASE = 'purchase'
    SALE_RETURN = 'sale_return'
    PURCHASE_RETURN = 'purchase_return'
    DAMAGED = 'damaged'

    INVOICE_TYPE_CHOICES = [
        (SALE, _("بيع")),
        (PURCHASE, _("شراء")),
        (SALE_RETURN, _("مرتجع بيع")),
        (PURCHASE_RETURN, _("مرتجع شراء")),
        (DAMAGED, _("تالف")),
    ]

    CASH = 'cash'
    CREDIT = 'credit'

    PAYMENT_TYPE_CHOICES = [
        (CASH, _("نقدي")),
        (CREDIT, _("آجل")),
    ]

    DISCOUNT_TYPE_CHOICES = [
        ('value', _("قيمة")),
        ('percent', _("نسبة")),
    ]

    TAX_TYPE_CHOICES = [
        ('value', _("قيمة")),
        ('percent', _("نسبة")),
    ]

    number = models.CharField(_("رقم الفاتورة"), max_length=50)
    date = models.DateTimeField(_("تاريخ الفاتورة"), default=timezone.now)
    invoice_type = models.CharField(_("نوع الفاتورة"), max_length=20, choices=INVOICE_TYPE_CHOICES)
    payment_type = models.CharField(_("نوع الدفع"), max_length=10, choices=PAYMENT_TYPE_CHOICES)
    contact = models.ForeignKey(Contact, on_delete=models.PROTECT, related_name='invoices', verbose_name=_("جهة الاتصال"), null=True, blank=True)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='invoices', verbose_name=_("المخزن"))
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='invoices', verbose_name=_("الخزنة"), null=True, blank=True)
    representative = models.ForeignKey(Representative, on_delete=models.SET_NULL, related_name='invoices',
                                     verbose_name=_("المندوب"), null=True, blank=True)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, related_name='invoices',
                             verbose_name=_("السائق"), null=True, blank=True)

    total_amount = models.DecimalField(_("إجمالي الفاتورة"), max_digits=15, decimal_places=2, default=0)
    
    discount_type = models.CharField(_("نوع الخصم"), max_length=10, choices=DISCOUNT_TYPE_CHOICES, default='value')
    discount_value = models.DecimalField(_("قيمة/نسبة الخصم"), max_digits=15, decimal_places=2, default=0)
    discount_amount = models.DecimalField(_("مبلغ الخصم النهائي"), max_digits=15, decimal_places=2, default=0)
    
    tax_type = models.CharField(_("نوع الضريبة"), max_length=10, choices=TAX_TYPE_CHOICES, default='value')
    tax_value = models.DecimalField(_("قيمة/نسبة الضريبة"), max_digits=15, decimal_places=2, default=0)
    tax_amount = models.DecimalField(_("مبلغ الضريبة النهائي"), max_digits=15, decimal_places=2, default=0)
    
    net_amount = models.DecimalField(_("صافي الفاتورة"), max_digits=15, decimal_places=2, default=0)

    paid_amount = models.DecimalField(_("المبلغ المدفوع"), max_digits=15, decimal_places=2, default=0)
    remaining_amount = models.DecimalField(_("المبلغ المتبقي"), max_digits=15, decimal_places=2, default=0)

    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    is_posted = models.BooleanField(_("مرحلة"), default=True)

    class Meta:
        verbose_name = _("فاتورة")
        verbose_name_plural = _("الفواتير")

    def __str__(self):
        contact_name = self.contact.name if self.contact else _("بدون جهة اتصال")
        return f"{self.get_invoice_type_display()} {self.number} - {contact_name}"

    def save(self, *args, **kwargs):
        # حساب المبالغ
        self.net_amount = self.total_amount - self.discount_amount + self.tax_amount

        if self.payment_type == self.CASH:
            self.paid_amount = self.net_amount
            self.remaining_amount = 0
        else:
            self.remaining_amount = self.net_amount - self.paid_amount

        # حفظ الفاتورة
        super().save(*args, **kwargs)

    def calculate_totals(self):
        """حساب إجماليات الفاتورة من بنودها والخصومات العامة"""
        items = self.items.all()

        total_amount = sum(item.quantity * item.unit_price for item in items)
        items_discount = sum(item.discount_amount for item in items)
        items_tax = sum(item.tax_amount for item in items)

        # حساب الخصم العالمي
        global_discount_amount = 0
        if self.discount_type == 'percent':
            global_discount_amount = (total_amount * self.discount_value) / 100
        else:
            global_discount_amount = self.discount_value

        # حساب الضريبة العالمية
        global_tax_amount = 0
        if self.tax_type == 'percent':
            global_tax_amount = ((total_amount - global_discount_amount) * self.tax_value) / 100
        else:
            global_tax_amount = self.tax_value

        # تحديث قيم الفاتورة
        self.total_amount = total_amount
        self.discount_amount = items_discount + global_discount_amount
        self.tax_amount = items_tax + global_tax_amount
        self.net_amount = total_amount - self.discount_amount + self.tax_amount

        # تحديث المدفوع والمتبقي بناءً على نوع الدفع
        if self.payment_type == self.CASH:
            self.paid_amount = self.net_amount
            self.remaining_amount = 0
        else:
            self.remaining_amount = self.net_amount - self.paid_amount

    @transaction.atomic
    def create_related_transactions(self):
        """إنشاء المعاملات المالية والمخزنية المرتبطة بالفاتورة عند ترحيلها"""
        # استيراد النماذج هنا لتجنب التبعيات الدائرية
        from finances.models import ContactTransaction, SafeTransaction, ProductTransaction
        from accounting.models import JournalEntry, JournalItem, Account
        from core.models import SystemSettings

        print(f"=== بدء إنشاء المعاملات المالية والمخزنية للفاتورة رقم {self.number} ===")
        
        settings = SystemSettings.get_settings()
        
        # التأكد من وجود حسابات لجهة الاتصال والمخزن والخزنة
        if self.contact:
            if not self.contact.customer_account and not self.contact.supplier_account and not self.contact.account:
                from core.signals import handle_contact_account
                handle_contact_account(None, self.contact, created=True)
                self.contact.refresh_from_db()
            
        if self.store and not self.store.account:
            from core.signals import handle_store_account
            handle_store_account(None, self.store, created=True)
            self.store.refresh_from_db()
            
        if self.safe and not self.safe.account:
            from core.signals import handle_safe_account
            handle_safe_account(None, self.safe, created=True)
            self.safe.refresh_from_db()

        # تحديد حساب جهة الاتصال بناءً على نوع الفاتورة
        contact_account = None
        if self.contact:
            if self.invoice_type in [self.SALE, self.SALE_RETURN]:
                contact_account = self.contact.customer_account or self.contact.account
            else:
                contact_account = self.contact.supplier_account or self.contact.account

        safe_account = self.safe.account if self.safe else None
        store_account = self.store.account if self.store else None

        if self.contact and not contact_account:
            raise ValueError(f"جهة الاتصال '{self.contact.name}' غير مرتبطة بحساب محاسبي، يرجى ربطها أولاً.")
        
        if self.store and not store_account:
            raise ValueError(f"المخزن '{self.store.name}' غير مرتبط بحساب محاسبي، يرجى ربطه أولاً.")

        # حذف أي قيود سابقة مرتبطة بهذه الفاتورة لتجنب التكرار
        JournalEntry.objects.filter(reference=self.number).delete()

        # إنشاء قيد محاسبي تلقائي
        journal_entry = JournalEntry.objects.create(
            entry_number=f"INV-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            date=self.date,
            description=f"قيد تلقائي للفاتورة رقم {self.number} - {self.get_invoice_type_display()}",
            reference=self.number
        )

        # --- 1. القيود المحاسبية ---
        if self.invoice_type == self.SALE:
            # 1. من حساب العميل (مدين) بكامل قيمة الفاتورة
            if contact_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=contact_account,
                    debit=self.net_amount,
                    memo=f"مديونية فاتورة مبيعات {self.number}"
                )
            
            # 2. إلى حساب المبيعات (دائن) - مع دعم الحساب لكل بند
            sales_acc_default = settings.sales_account
            per_item_acc = settings.per_item_account_in_invoices
            per_item_cc = settings.distribute_cost_center_per_item_in_invoices
            discount_allowed_acc = settings.default_discount_allowed_account
            
            if per_item_acc or per_item_cc:
                # تجميع البنود حسب الحساب ومركز التكلفة
                account_groups = {}
                for item in self.items.all():
                    acc = item.account if (per_item_acc and item.account) else sales_acc_default
                    cc = item.cost_center if (per_item_cc and item.cost_center) else None
                    key = (acc.id if acc else None, cc.id if cc else None)
                    
                    if key not in account_groups:
                        account_groups[key] = {'account': acc, 'cost_center': cc, 'amount': 0, 'discount': 0}
                    
                    if discount_allowed_acc:
                        account_groups[key]['amount'] += item.total_price
                        account_groups[key]['discount'] += item.discount_amount
                    else:
                        account_groups[key]['amount'] += item.total_price - item.discount_amount
                
                for group in account_groups.values():
                    if group['account']:
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=group['account'],
                            cost_center=group['cost_center'],
                            credit=group['amount'],
                            memo=f"مبيعات فاتورة {self.number}"
                        )
                
                # إضافة الخصم المسموح به كبند منفصل إذا تم تحديده في الإعدادات
                if discount_allowed_acc and self.discount_amount > 0:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=discount_allowed_acc,
                        debit=self.discount_amount,
                        memo=f"خصم مسموح به فاتورة {self.number}"
                    )
            else:
                if sales_acc_default:
                    sales_amount = self.total_amount if discount_allowed_acc else (self.total_amount - self.discount_amount)
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=sales_acc_default,
                        credit=sales_amount,
                        memo=f"مبيعات فاتورة {self.number}"
                    )
                    
                    if discount_allowed_acc and self.discount_amount > 0:
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=discount_allowed_acc,
                            debit=self.discount_amount,
                            memo=f"خصم مسموح به فاتورة {self.number}"
                        )

            # 3. إلى حساب ضريبة القيمة المضافة - مخرجات (دائن)
            if self.tax_amount > 0:
                vat_out_acc = settings.vat_output_account
                if vat_out_acc:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=vat_out_acc,
                        credit=self.tax_amount,
                        vat_rate=settings.vat_percentage,
                        vat_amount=self.tax_amount,
                        memo=f"ضريبة مخرجات فاتورة {self.number}"
                    )

            # 4. تكلفة المبيعات والمخزون
            total_cost = 0
            for item in self.items.all():
                unit_cost = item.product_unit.purchase_price or 0
                total_cost += item.quantity * unit_cost

            if total_cost > 0:
                cogs_acc = settings.cogs_account
                if cogs_acc and store_account:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=cogs_acc,
                        debit=total_cost,
                        memo=f"تكلفة بضاعة مباعة فاتورة {self.number}"
                    )
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=store_account,
                        credit=total_cost,
                        memo=f"صرف مخزني فاتورة {self.number}"
                    )
            
        elif self.invoice_type == self.PURCHASE:
            # 1. من حساب المشتريات (مدين) - مع دعم الحساب لكل بند
            purch_acc_default = settings.purchases_account
            per_item_acc = settings.per_item_account_in_purchases
            per_item_cc = settings.distribute_cost_center_per_item_in_purchases
            discount_earned_acc = settings.default_discount_earned_account
            
            if per_item_acc or per_item_cc:
                # تجميع البنود حسب الحساب ومركز التكلفة
                account_groups = {}
                for item in self.items.all():
                    acc = item.account if (per_item_acc and item.account) else purch_acc_default
                    cc = item.cost_center if (per_item_cc and item.cost_center) else None
                    key = (acc.id if acc else None, cc.id if cc else None)
                    
                    if key not in account_groups:
                        account_groups[key] = {'account': acc, 'cost_center': cc, 'amount': 0, 'discount': 0}
                    
                    if discount_earned_acc:
                        account_groups[key]['amount'] += item.total_price
                        account_groups[key]['discount'] += item.discount_amount
                    else:
                        account_groups[key]['amount'] += item.total_price - item.discount_amount
                
                for group in account_groups.values():
                    if group['account']:
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=group['account'],
                            cost_center=group['cost_center'],
                            debit=group['amount'],
                            memo=f"مشتريات فاتورة {self.number}"
                        )
                
                # إضافة الخصم المكتسب كبند منفصل إذا تم تحديده في الإعدادات
                if discount_earned_acc and self.discount_amount > 0:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=discount_earned_acc,
                        credit=self.discount_amount,
                        memo=f"خصم مكتسب فاتورة {self.number}"
                    )
            else:
                if purch_acc_default:
                    if discount_earned_acc:
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=purch_acc_default,
                            debit=self.total_amount,
                            memo=f"مشتريات فاتورة {self.number}"
                        )
                        if self.discount_amount > 0:
                            JournalItem.objects.create(
                                journal_entry=journal_entry,
                                account=discount_earned_acc,
                                credit=self.discount_amount,
                                memo=f"خصم مكتسب فاتورة {self.number}"
                            )
                    else:
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=purch_acc_default,
                            debit=self.total_amount - self.discount_amount,
                            memo=f"مشتريات فاتورة {self.number}"
                        )

            # 2. من حساب ضريبة المدخلات
            if self.tax_amount > 0:
                vat_in_acc = settings.vat_input_account
                if vat_in_acc:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=vat_in_acc,
                        debit=self.tax_amount,
                        memo=f"ضريبة مدخلات فاتورة {self.number}"
                    )

            # 3. إلى حساب المورد (دائن) بكامل القيمة
            if contact_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=contact_account,
                    credit=self.net_amount,
                    memo=f"التزام فاتورة مشتريات {self.number}"
                )
            
            # 4. تحديث المخزون (تحويل من مشتريات لمخزون)
            if store_account and purch_acc_default:
                inventory_amount = self.total_amount - self.discount_amount
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=store_account,
                    debit=inventory_amount,
                    memo=f"إضافة مخزنية فاتورة {self.number}"
                )
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=purch_acc_default,
                    credit=inventory_amount,
                    memo=f"تسوية مشتريات لمخزون فاتورة {self.number}"
                )

        elif self.invoice_type == self.SALE_RETURN:
            # 1. من حساب مرتجعات المبيعات (مدين) - مع دعم الحساب لكل بند
            sales_ret_acc_default = settings.sales_return_account or settings.sales_account
            per_item_acc = settings.per_item_account_in_invoices
            per_item_cc = settings.distribute_cost_center_per_item_in_invoices
            discount_allowed_acc = settings.default_discount_allowed_account
            
            # تجميع البنود حسب الحساب ومركز التكلفة
            account_groups = {}
            for item in self.items.all():
                acc = item.account if (per_item_acc and item.account) else sales_ret_acc_default
                cc = item.cost_center if (per_item_cc and item.cost_center) else None
                key = (acc.id if acc else None, cc.id if cc else None)
                
                if key not in account_groups:
                    account_groups[key] = {'account': acc, 'cost_center': cc, 'amount': 0, 'discount': 0}
                
                if discount_allowed_acc:
                    account_groups[key]['amount'] += item.total_price
                    account_groups[key]['discount'] += item.discount_amount
                else:
                    account_groups[key]['amount'] += item.total_price - item.discount_amount
            
            for group in account_groups.values():
                if group['account']:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=group['account'],
                        cost_center=group['cost_center'],
                        debit=group['amount'],
                        memo=f"مرتجع مبيعات فاتورة {self.number}"
                    )
            
            # عكس الخصم المسموح به كبند منفصل إذا تم تحديده في الإعدادات
            if discount_allowed_acc and self.discount_amount > 0:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=discount_allowed_acc,
                    credit=self.discount_amount,
                    memo=f"عكس خصم مسموح به لمرتجع {self.number}"
                )

            # 2. من حساب ضريبة المخرجات (مدين - عكس القيد الأصلي)
            if self.tax_amount > 0:
                vat_out_acc = settings.vat_output_account
                if vat_out_acc:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=vat_out_acc,
                        debit=self.tax_amount,
                        memo=f"عكس ضريبة مخرجات لمرتجع {self.number}"
                    )

            # 3. إلى حساب العميل (دائن)
            if contact_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=contact_account,
                    credit=self.net_amount,
                    memo=f"تخفيض مديونية مرتجع مبيعات {self.number}"
                )

            # 4. عكس تكلفة المبيعات (إرجاع للمخزون)
            total_cost = 0
            for item in self.items.all():
                unit_cost = item.product_unit.purchase_price or 0
                total_cost += item.quantity * unit_cost

            if total_cost > 0:
                cogs_acc = settings.cogs_account
                if cogs_acc and store_account:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=store_account,
                        debit=total_cost,
                        memo=f"إرجاع مخزني لمرتجع مبيعات {self.number}"
                    )
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=cogs_acc,
                        credit=total_cost,
                        memo=f"عكس تكلفة بضاعة مباعة لمرتجع {self.number}"
                    )

        elif self.invoice_type == self.PURCHASE_RETURN:
            # 1. من حساب المورد (مدين)
            if contact_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=contact_account,
                    debit=self.net_amount,
                    memo=f"تخفيض التزام لمرتجع مشتريات {self.number}"
                )

            # 2. إلى حساب مرتجعات المشتريات (دائن) - مع دعم الحساب لكل بند
            purch_ret_acc_default = settings.purchase_returns_account or settings.purchases_account
            per_item_acc = settings.per_item_account_in_purchases
            per_item_cc = settings.distribute_cost_center_per_item_in_purchases
            discount_earned_acc = settings.default_discount_earned_account
            
            # تجميع البنود حسب الحساب ومركز التكلفة
            account_groups = {}
            for item in self.items.all():
                acc = item.account if (per_item_acc and item.account) else purch_ret_acc_default
                cc = item.cost_center if (per_item_cc and item.cost_center) else None
                key = (acc.id if acc else None, cc.id if cc else None)
                
                if key not in account_groups:
                    account_groups[key] = {'account': acc, 'cost_center': cc, 'amount': 0, 'discount': 0}
                
                if discount_earned_acc:
                    account_groups[key]['amount'] += item.total_price
                    account_groups[key]['discount'] += item.discount_amount
                else:
                    account_groups[key]['amount'] += item.total_price - item.discount_amount
            
            for group in account_groups.values():
                if group['account']:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=group['account'],
                        cost_center=group['cost_center'],
                        credit=group['amount'],
                        memo=f"مرتجع مشتريات فاتورة {self.number}"
                    )
            
            # عكس الخصم المكتسب كبند منفصل إذا تم تحديده في الإعدادات
            if discount_earned_acc and self.discount_amount > 0:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=discount_earned_acc,
                    debit=self.discount_amount,
                    memo=f"عكس خصم مكتسب لمرتجع {self.number}"
                )

            # 3. إلى حساب ضريبة المدخلات (دائن - عكس القيد الأصلي)
            if self.tax_amount > 0:
                vat_in_acc = settings.vat_input_account
                if vat_in_acc:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=vat_in_acc,
                        credit=self.tax_amount,
                        memo=f"عكس ضريبة مدخلات لمرتجع {self.number}"
                    )

            # 4. تحديث المخزون (خصم من المخزون)
            if store_account:
                # نحتاج لعكس قيد المخزون الأصلي: من المخزون إلى المشتريات
                # إذن هنا: من المشتريات (أو المرتجعات) إلى المخزون
                inventory_amount = self.total_amount - self.discount_amount
                
                # الطرف المدين: حساب المشتريات أو المرتجعات (تم استخدامه أعلاه في الخطوة 2 كدائن، وهنا كمدين للتسوية)
                # ولكن الأفضل استخدام الحساب الافتراضي للتسوية المخزنية
                if purch_ret_acc_default:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=purch_ret_acc_default,
                        debit=inventory_amount,
                        memo=f"تسوية مرتجع مشتريات من مخزون فاتورة {self.number}"
                    )
                    
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=store_account,
                        credit=inventory_amount,
                        memo=f"خصم مخزني لمرتجع مشتريات {self.number}"
                    )

        elif self.invoice_type == self.DAMAGED:
            # 1. من حساب التالف (مدين) - مع دعم الحساب لكل بند
            damaged_acc_default = settings.damaged_account
            
            if not damaged_acc_default and not any(item.account for item in self.items.all()):
                raise ValueError(_("حساب التالف غير محدد في الإعدادات، يرجى ضبطه أولاً."))
            per_item_acc = settings.per_item_account_in_invoices # نستخدم إعدادات الفواتير العامة
            per_item_cc = settings.distribute_cost_center_per_item_in_invoices
            
            # تجميع البنود حسب الحساب ومركز التكلفة
            account_groups = {}
            for item in self.items.all():
                acc = item.account if (per_item_acc and item.account) else damaged_acc_default
                cc = item.cost_center if (per_item_cc and item.cost_center) else None
                key = (acc.id if acc else None, cc.id if cc else None)
                
                if key not in account_groups:
                    account_groups[key] = {'account': acc, 'cost_center': cc, 'amount': 0}
                
                # التالف عادة لا يحسب فيه الخصم أو الضريبة في القيد البسيط، نأخذ القيمة الصافية للبند
                account_groups[key]['amount'] += (item.total_price - item.discount_amount)
            
            for group in account_groups.values():
                if group['account']:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=group['account'],
                        cost_center=group['cost_center'],
                        debit=group['amount'],
                        memo=f"إثبات تالف فاتورة {self.number}"
                    )
            
            # 2. إلى حساب المخزون (دائن) بكامل القيمة الصافية
            if store_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=store_account,
                    credit=self.total_amount - self.discount_amount,
                    memo=f"خصم تالف من المخزون فاتورة {self.number}"
                )

        # 5. معالجة الدفع (إذا وجد مبلغ مدفوع)
        # لا يتم إنشاء سداد تلقائي للفواتير التالفة
        if self.invoice_type != self.DAMAGED and self.paid_amount > 0 and not Payment.objects.filter(invoice=self).exists():
            payment_type = Payment.RECEIPT if self.invoice_type == self.SALE else Payment.PAYMENT
            payment_number = f"PAY-{self.number}"
            
            # نحفظ المبلغ مؤقتاً ونصفر الحقل في الفاتورة ليتولى نموذج Payment تحديثه بشكل صحيح
            amount_to_pay = self.paid_amount
            self.paid_amount = 0
            
            Payment.objects.create(
                number=payment_number,
                date=self.date,
                payment_type=payment_type,
                amount=amount_to_pay,
                contact=self.contact,
                safe=self.safe,
                invoice=self,
                notes=f"سداد تلقائي عند إنشاء فاتورة رقم {self.number}",
                is_posted=True
            )
        
        # ترحيل القيد
        try:
            journal_entry.post()
        except Exception as e:
            print(f"فشل ترحيل القيد التلقائي: {str(e)}")
            # في حالة الفشل، نترك القيد غير مرحل للمراجعة، أو نرفع خطأ إذا كان ذلك مطلوباً
            # لضمان سلامة البيانات، نرفع خطأ هنا ليتوقف الترحيل
            raise ValueError(f"فشل ترحيل القيد المحاسبي: {str(e)}")

        # --- 2. معاملات الحسابات (ContactTransaction) ---
        contact_type = None
        if self.invoice_type == self.SALE:
            contact_type = ContactTransaction.SALE_INVOICE
        elif self.invoice_type == self.PURCHASE:
            contact_type = ContactTransaction.PURCHASE_INVOICE
        elif self.invoice_type == self.SALE_RETURN:
            contact_type = ContactTransaction.SALE_RETURN_INVOICE
        elif self.invoice_type == self.PURCHASE_RETURN:
            contact_type = ContactTransaction.PURCHASE_RETURN_INVOICE
        elif self.invoice_type == self.DAMAGED:
            contact_type = ContactTransaction.DAMAGED

        # إنشاء معاملة الفاتورة (المديونية/الاستحقاق فقط)
        if contact_type and self.contact:
            ContactTransaction.objects.create(
                contact=self.contact,
                date=self.date,
                # في المرتجعات، المبلغ يكون سالباً لتخفيض الرصيد
                amount=self.net_amount if self.invoice_type in [self.SALE, self.PURCHASE] else -self.net_amount,
                transaction_type=contact_type,
                invoice=self,
                description=f"فاتورة {self.get_invoice_type_display()} رقم {self.number}",
                reference_number=self.number,
                balance_before=0,
                balance_after=0
            )
        # ملاحظة: تم إزالة إنشاء معاملة السداد من هنا لأنها تتم عبر نموذج Payment

        # --- 3. معاملات الخزنة (SafeTransaction) ---
        # ملاحظة: تم إزالة إنشاء معاملة الخزنة من هنا لأنها تتم عبر نموذج Payment

        # --- 4. حركات المخزون (ProductTransaction) ---
        for item in self.items.all():
            product = item.product
            
            # تخطي المنتجات الخدمية في حركات المخزون
            if product.product_type == 'service':
                continue
                
            # التعامل مع المنتج التجميعي
            if product.product_type == 'assembly':
                # خصم المكونات بدلاً من المنتج التجميعي نفسه
                for component in product.components.all():
                    # حساب الكمية الكلية للمكون (كمية البند * كمية المكون في التجميعة)
                    comp_quantity = item.quantity * component.quantity
                    
                    ProductTransaction.objects.create(
                        product=component.component_product,
                        date=self.date,
                        quantity=comp_quantity,
                        # نستخدم الوحدة الافتراضية للمكون أو يمكن تحسينها لاحقاً
                        product_unit=component.component_product.units.filter(conversion_factor=1).first(),
                        base_quantity=comp_quantity * 1, # نفترض الوحدة الأساسية
                        transaction_type=self.invoice_type,
                        invoice=self,
                        store=self.store,
                        description=f"{'إضافة' if self.invoice_type in [self.PURCHASE, self.SALE_RETURN] else 'خصم'} مكونات تجميعة: {product.name} - فاتورة {self.get_invoice_type_display()} رقم {self.number}",
                        reference_number=self.number,
                        balance_before=0,
                        balance_after=0
                    )
            else:
                # المنتج البسيط العادي
                ProductTransaction.objects.create(
                    product=item.product,
                    date=self.date,
                    quantity=item.quantity,
                    product_unit=item.product_unit,
                    base_quantity=item.quantity * item.product_unit.conversion_factor,
                    transaction_type=self.invoice_type,
                    invoice=self,
                    store=self.store,
                    description=f"فاتورة {self.get_invoice_type_display()} رقم {self.number}",
                    reference_number=self.number,
                    balance_before=0,
                    balance_after=0
                )

        print(f"=== تم إنشاء جميع المعاملات للفاتورة {self.number} بنجاح ===")



    def post_invoice(self):
        """ترحيل الفاتورة وإنشاء المعاملات المالية والمخزنية"""
        # التحقق من وجود معاملات مالية ومخزنية مرتبطة بالفاتورة
        from finances.models import ContactTransaction, SafeTransaction, ProductTransaction
        from django.db import transaction as db_transaction
        from core.models import SystemSettings

        contact_transactions = ContactTransaction.objects.filter(invoice=self)
        safe_transactions = SafeTransaction.objects.filter(invoice=self)
        product_transactions = ProductTransaction.objects.filter(invoice=self)

        # الحصول على إعدادات النظام
        settings = SystemSettings.get_settings()

        print(f"=== بدء ترحيل الفاتورة {self.number} ===")
        print(f"حالة الترحيل الحالية: {self.is_posted}")
        print(f"عدد معاملات العملاء/الموردين الحالية: {contact_transactions.count()}")
        print(f"عدد معاملات الخزنة الحالية: {safe_transactions.count()}")
        print(f"عدد معاملات المخزون الحالية: {product_transactions.count()}")

        # إذا كانت هناك معاملات موجودة بالفعل، قم بحذفها أولاً
        if contact_transactions.count() > 0 or safe_transactions.count() > 0 or product_transactions.count() > 0:
            print(f"حذف المعاملات الموجودة للفاتورة {self.number} قبل إعادة الترحيل")
            with db_transaction.atomic():
                # حذف المعاملات الخاصة بالفاتورة فقط واستثناء المعاملات المرتبطة بسندات الدفع
                contact_transactions.filter(payment__isnull=True).delete()
                safe_transactions.filter(created_by_payment__isnull=True).delete()
                product_transactions.delete()

        # إنشاء المعاملات المالية والمخزنية
        try:
            with db_transaction.atomic():
                # إنشاء المعاملات المالية والمخزنية
                self.create_related_transactions()

                # التحقق من نجاح إنشاء المعاملات
                new_contact_transactions = ContactTransaction.objects.filter(invoice=self)
                new_safe_transactions = SafeTransaction.objects.filter(invoice=self)
                new_product_transactions = ProductTransaction.objects.filter(invoice=self)

                print(f"عدد معاملات العملاء/الموردين بعد الترحيل: {new_contact_transactions.count()}")
                print(f"عدد معاملات الخزنة بعد الترحيل: {new_safe_transactions.count()}")
                print(f"عدد معاملات المخزون بعد الترحيل: {new_product_transactions.count()}")

                # التحقق من إنشاء جميع المعاملات المطلوبة
                items_count = self.items.count()
                
                # حساب عدد حركات المخزون المتوقعة
                expected_product_transactions = 0
                for item in self.items.all():
                    if item.product.product_type == 'service':
                        continue
                    elif item.product.product_type == 'assembly':
                        expected_product_transactions += item.product.components.count()
                    else:
                        expected_product_transactions += 1

                if self.invoice_type != self.DAMAGED and new_contact_transactions.count() == 0:
                    raise Exception("لم يتم إنشاء معاملات العملاء/الموردين")

                if self.invoice_type != self.DAMAGED and (self.payment_type == 'cash' or self.paid_amount > 0) and new_safe_transactions.count() == 0:
                    raise Exception("لم يتم إنشاء معاملات الخزنة للفاتورة النقدية أو الفاتورة الآجلة مع دفعة جزئية")

                if new_product_transactions.count() != expected_product_transactions:
                    raise Exception(f"عدد معاملات المخزون ({new_product_transactions.count()}) لا يتطابق مع عدد حركات المخزون المتوقعة ({expected_product_transactions})")

                # تحديث أسعار المنتجات بناءً على إعدادات النظام
                self.update_product_prices(settings)

                # ثم تعيين حالة الترحيل وحفظ النموذج
                self.is_posted = True
                self.save(update_fields=['is_posted'])

                print(f"تم ترحيل الفاتورة {self.number} وإنشاء المعاملات المالية والمخزنية بنجاح")
                return True
        except Exception as e:
            print(f"خطأ في ترحيل الفاتورة {self.number}: {str(e)}")
            import traceback
            print(f"تتبع الخطأ: {traceback.format_exc()}")

            # محاولة تنظيف أي معاملات قد تكون تم إنشاؤها جزئيًا
            try:
                with db_transaction.atomic():
                    ContactTransaction.objects.filter(invoice=self, payment__isnull=True).delete()
                    SafeTransaction.objects.filter(invoice=self, created_by_payment__isnull=True).delete()
                    ProductTransaction.objects.filter(invoice=self).delete()
                    print(f"تم تنظيف المعاملات الجزئية للفاتورة {self.number}")
            except Exception as cleanup_error:
                print(f"خطأ في تنظيف المعاملات الجزئية: {str(cleanup_error)}")

            return False

    def update_product_prices(self, settings):
        """تحديث أسعار المنتجات بناءً على إعدادات النظام"""
        print(f"=== تحديث أسعار المنتجات للفاتورة {self.number} ===")

        # التحقق من إعدادات تحديث الأسعار
        update_purchase_price = settings.update_purchase_price
        update_sale_price = settings.update_sale_price

        # لا نقوم بتحديث الأسعار إذا كانت الإعدادات معطلة
        if not update_purchase_price and not update_sale_price:
            print("تحديث الأسعار معطل في إعدادات النظام")
            return

        # تحديث أسعار المنتجات بناءً على نوع الفاتورة
        for item in self.items.all():
            product = item.product
            product_unit = item.product_unit
            unit_price = item.unit_price

            print(f"معالجة المنتج: {product.name}, الوحدة: {product_unit.unit.name}, السعر: {unit_price}")

            # تحديث سعر الشراء للمنتج في فواتير الشراء
            if self.invoice_type == self.PURCHASE and update_purchase_price:
                print(f"تحديث سعر الشراء للمنتج {product.name} من {product_unit.purchase_price} إلى {unit_price}")
                product_unit.purchase_price = unit_price
                product_unit.save(update_fields=['purchase_price'])
                print(f"تم تحديث سعر الشراء للمنتج {product.name} إلى {product_unit.purchase_price}")

            # تحديث سعر البيع للمنتج في فواتير البيع
            elif self.invoice_type == self.SALE and update_sale_price:
                print(f"تحديث سعر البيع للمنتج {product.name} من {product_unit.selling_price} إلى {unit_price}")
                product_unit.selling_price = unit_price
                product_unit.save(update_fields=['selling_price'])
                print(f"تم تحديث سعر البيع للمنتج {product.name} إلى {product_unit.selling_price}")

        print(f"=== تم تحديث أسعار المنتجات للفاتورة {self.number} ===")

    def unpost_invoice(self):
        """إلغاء ترحيل الفاتورة (يتطلب إلغاء المعاملات المالية والمخزنية المرتبطة)"""
        if self.is_posted:
            from finances.models import ContactTransaction, SafeTransaction, ProductTransaction
            from accounting.models import JournalEntry

            with transaction.atomic():
                # 1. إلغاء ترحيل سندات القبض/الصرف المرتبطة
                for payment in self.payments.all():
                    if payment.is_posted:
                        payment.unpost_payment()

                # 2. حذف حركات المنتجات
                ProductTransaction.objects.filter(invoice=self).delete()

                # 3. حذف حركات الحسابات (التي ليست مرتبطة بسند)
                ContactTransaction.objects.filter(invoice=self, payment__isnull=True).delete()

                # 4. حذف حركات الخزنة (التي ليست مرتبطة بسند)
                SafeTransaction.objects.filter(invoice=self, created_by_payment__isnull=True).delete()

                # 5. إلغاء ترحيل أو حذف القيد المحاسبي للفاتورة
                journal_entry = JournalEntry.objects.filter(reference=self.number).exclude(entry_number__startswith="PAY-").first()
                if journal_entry:
                    journal_entry.unpost()
                    journal_entry.delete()

                # 6. تحديث حالة الفاتورة
                self.is_posted = False
                self.save(update_fields=['is_posted'])

            return True
        return False

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items', verbose_name=_("الفاتورة"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='invoice_items', verbose_name=_("المنتج"))
    product_unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE, related_name='invoice_items', verbose_name=_("وحدة المنتج"))
    quantity = models.DecimalField(_("الكمية"), max_digits=15, decimal_places=3)
    unit_price = models.DecimalField(_("سعر الوحدة"), max_digits=15, decimal_places=2)
    total_price = models.DecimalField(_("السعر الإجمالي"), max_digits=15, decimal_places=2)
    discount_percentage = models.DecimalField(_("نسبة الخصم"), max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(_("مبلغ الخصم"), max_digits=15, decimal_places=2, default=0)
    tax_percentage = models.DecimalField(_("نسبة الضريبة"), max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(_("مبلغ الضريبة"), max_digits=15, decimal_places=2, default=0)
    net_price = models.DecimalField(_("السعر الصافي"), max_digits=15, decimal_places=2)
    
    # حقول إضافية حسب إعدادات النظام
    account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                               related_name='invoice_items', verbose_name=_("الحساب المحاسبي"))
    cost_center = models.ForeignKey('accounting.CostCenter', on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='invoice_items', verbose_name=_("مركز التكلفة"))
    
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)

    class Meta:
        verbose_name = _("بند الفاتورة")
        verbose_name_plural = _("بنود الفواتير")

    def __str__(self):
        return f"{self.product.name} - {self.invoice.number}"

    def save(self, *args, **kwargs):
        # جلب إعدادات النظام للحصول على نسبة الضريبة الافتراضية
        from core.models import SystemSettings
        settings = SystemSettings.get_settings()
        
        # إذا كانت نسبة الضريبة 0، نستخدم النسبة من إعدادات النظام
        if self.tax_percentage == 0 and settings.vat_percentage > 0:
            self.tax_percentage = settings.vat_percentage

        self.total_price = self.quantity * self.unit_price
        self.discount_amount = self.total_price * (Decimal(str(self.discount_percentage)) / Decimal('100'))
        self.tax_amount = (self.total_price - self.discount_amount) * (Decimal(str(self.tax_percentage)) / Decimal('100'))
        self.net_price = self.total_price - self.discount_amount + self.tax_amount
        
        super().save(*args, **kwargs)
        
        # تحديث إجماليات الفاتورة بعد حفظ البند
        if self.invoice:
            self.invoice.calculate_totals()
            self.invoice.save()

class Payment(models.Model):
    """نموذج تحصيلات ومدفوعات العملاء والموردين"""

    RECEIPT = 'receipt'  # تحصيل من العميل
    PAYMENT = 'payment'  # دفع للمورد

    PAYMENT_TYPE_CHOICES = [
        (RECEIPT, _('تحصيل من العميل')),
        (PAYMENT, _('دفع للمورد')),
    ]

    number = models.CharField(_("رقم المستند"), max_length=50)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    payment_type = models.CharField(_("نوع العملية"), max_length=10, choices=PAYMENT_TYPE_CHOICES)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    contact = models.ForeignKey(Contact, on_delete=models.PROTECT, related_name='payments',
                              verbose_name=_("العميل/المورد"), null=True, blank=True)
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='contact_payments',
                           verbose_name=_("الخزنة"), null=True, blank=True)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='contact_payments',
                           verbose_name=_("البنك"), null=True, blank=True)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True,
                              related_name="payments", verbose_name=_("الفاتورة المرتبطة"))
    expense_category = models.ForeignKey('finances.ExpenseCategory', on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name="payments", verbose_name=_("قسم المصروفات"))
    income_category = models.ForeignKey('finances.IncomeCategory', on_delete=models.SET_NULL, null=True, blank=True,
                                      related_name="payments", verbose_name=_("قسم الإيرادات"))
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # العلاقة مع معاملة الخزنة - تم إنشاؤها بواسطة التحصيل/الدفع
    created_transaction = models.OneToOneField('finances.SafeTransaction', on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='created_by_payment',
                                         verbose_name=_("حركة الخزنة المنشأة"))

    # العلاقة مع القيد المحاسبي - تم إنشاؤه بواسطة التحصيل/الدفع
    journal_entry = models.OneToOneField('accounting.JournalEntry', on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='created_by_payment',
                                         verbose_name=_("القيد المحاسبي المنشأ"))

    # المعاملة المالية للعميل أو المورد مرتبطة بهذا التحصيل/الدفع
    contact_transaction = models.OneToOneField('finances.ContactTransaction', on_delete=models.SET_NULL,
                                            null=True, blank=True, related_name='payment',
                                            verbose_name=_("حركة حساب العميل/المورد"))

    class Meta:
        verbose_name = _("تحصيل/دفع")
        verbose_name_plural = _("التحصيلات والمدفوعات")
        ordering = ['-date']

    def __str__(self):
        return f"{self.number} - {self.contact.name} - {self.amount}"

    @property
    def status_badge(self):
        """عرض حالة السند بشكل محسن"""
        from django.utils.safestring import mark_safe
        if self.is_posted:
            return mark_safe('<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> مرحل</span>')
        return mark_safe('<span class="badge bg-warning text-dark"><i class="fas fa-edit me-1"></i> مسودة</span>')

    def save(self, *args, **kwargs):
        # حفظ النموذج أولاً
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # إذا كان جديدًا وليس له معاملة مرتبطة، قم بعملية الترحيل تلقائيًا
        if is_new and not self.created_transaction:
            self.post_payment()

    @transaction.atomic
    def create_related_transactions(self):
        """إنشاء المعاملات المالية المرتبطة بالدفعة"""
        from finances.models import ContactTransaction, SafeTransaction
        from accounting.models import JournalEntry, JournalItem
        from core.models import SystemSettings

        # الحصول على إعدادات النظام
        settings = SystemSettings.get_settings()

        # تحديد نوع المعاملة في الخزنة
        transaction_type = None
        description = ""
        contact_amount = 0
        transaction_effect = 0

        if self.payment_type == self.RECEIPT:
            transaction_type = SafeTransaction.COLLECTION
            description = f"تحصيل من العميل: {self.contact.name}"
            if self.income_category:
                description += f" - قسم: {self.income_category.name}"
            contact_amount = -self.amount  # تخفيض رصيد العميل
            transaction_effect = ContactTransaction.COLLECTION
        else:  # PAYMENT
            transaction_type = SafeTransaction.PAYMENT
            description = f"دفع للمورد: {self.contact.name}"
            if self.expense_category:
                description += f" - قسم: {self.expense_category.name}"
            # في حالة الدفع للمورد، يتم إنقاص رصيد المورد (دائن ينقص)
            # رصيد المورد في النظام يكون موجباً (التزام)، والدفع ينقصه
            contact_amount = -self.amount
            transaction_effect = ContactTransaction.PAYMENT

        # إضافة معلومات الفاتورة إلى الوصف إذا كانت مرتبطة بفاتورة
        if self.invoice:
            description += f" - الفاتورة رقم {self.invoice.number}"

        # إضافة اسم الخزنة أو البنك إلى الوصف
        if self.safe:
            description += f" - خزنة: {self.safe.name}"
        elif self.bank:
            description += f" - بنك: {self.bank.name}"

        # 1. إنشاء قيد محاسبي تلقائي
        journal_entry = JournalEntry.objects.create(
            entry_number=f"PAY-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            date=self.date,
            description=f"قيد تلقائي لسند {self.get_payment_type_display()} رقم {self.number}",
            reference=self.number
        )
        self.journal_entry = journal_entry

        # تحديد حساب جهة الاتصال بناءً على نوع الدفعة
        contact_account = None
        if self.payment_type == self.RECEIPT:
            contact_account = self.contact.customer_account or self.contact.account or settings.default_customer_account
        else:
            contact_account = self.contact.supplier_account or self.contact.account or settings.default_supplier_account
        
        # الحصول على حساب الخزنة أو البنك
        payment_account = self.safe.account if self.safe else (self.bank.account if self.bank else None)

        if not payment_account:
            raise Exception(f"الحساب المحاسبي ل{'لخزنة' if self.safe else 'لبنك'} غير محدد")

        if self.payment_type == self.RECEIPT:
            # من حساب الخزنة/البنك (مدين) إلى حساب العميل (دائن)
            JournalItem.objects.create(
                journal_entry=journal_entry,
                account=payment_account,
                debit=self.amount,
                memo=description
            )
            
            # إذا كان هناك قسم إيراد مربوط بحساب، نستخدم حسابه بدلاً من حساب العميل (أو بالإضافة له حسب السياسة)
            # هنا سنتبع سياسة: إذا وجد قسم إيراد، يكون هو الطرف الدائن
            credit_account = self.income_category.account if (self.income_category and self.income_category.account) else contact_account
            
            if not credit_account:
                raise Exception("حساب العميل أو قسم الإيراد غير محدد. يرجى التأكد من ربط حساب بجهة الاتصال أو اختيار قسم إيراد له حساب، أو ضبط الحساب الافتراضي في الإعدادات.")

            JournalItem.objects.create(
                journal_entry=journal_entry,
                account=credit_account,
                credit=self.amount,
                memo=description
            )
        else:  # PAYMENT
            # من حساب المورد (مدين) إلى حساب الخزنة/البنك (دائن)
            
            # إذا كان هناك قسم مصروف مربوط بحساب، نستخدم حسابه بدلاً من حساب المورد
            debit_account = self.expense_category.account if (self.expense_category and self.expense_category.account) else contact_account
            
            if not debit_account:
                raise Exception("حساب المورد أو قسم المصروف غير محدد. يرجى التأكد من ربط حساب بجهة الاتصال أو اختيار قسم مصروف له حساب، أو ضبط الحساب الافتراضي في الإعدادات.")

            JournalItem.objects.create(
                journal_entry=journal_entry,
                account=debit_account,
                debit=self.amount,
                memo=description
            )

            JournalItem.objects.create(
                journal_entry=journal_entry,
                account=payment_account,
                credit=self.amount,
                memo=description
            )

        # ترحيل القيد
        try:
            journal_entry.post()
        except Exception as e:
            # إذا فشل ترحيل القيد، نقوم برفع استثناء لإلغاء المعاملة بالكامل
            raise Exception(f"فشل ترحيل قيد السند: {str(e)}")


        # 2. إنشاء معاملة خزنة أو بنك
        source_obj = self.safe or self.bank
        if not source_obj:
            raise Exception("يجب اختيار خزنة أو بنك")

        current_balance = source_obj.current_balance

        # تحديد تأثير العملية على رصيد الخزنة/البنك
        if self.payment_type == self.RECEIPT:
            # تحصيل من العميل يزيد رصيد الخزنة/البنك
            balance_after = current_balance + self.amount
        else:  # PAYMENT
            # دفع للمورد ينقص رصيد الخزنة/البنك
            balance_after = current_balance - self.amount

        safe_transaction = SafeTransaction(
            safe=self.safe,
            bank=self.bank,
            date=self.date,  # استخدام تاريخ التحصيل/الدفع
            amount=self.amount,
            transaction_type=transaction_type,
            description=description,
            reference_number=self.number,
            balance_before=current_balance,
            balance_after=balance_after
        )

        if self.invoice:
            safe_transaction.invoice = self.invoice
            safe_transaction.contact = self.contact

        safe_transaction.save()
        self.created_transaction = safe_transaction

        # 2. إنشاء معاملة حساب العميل/المورد
        if self.payment_type == self.RECEIPT:
            current_balance = self.contact.current_balance
        else:
            current_balance = self.contact.current_supplier_balance
            
        balance_after = current_balance + contact_amount

        contact_transaction = ContactTransaction(
            contact=self.contact,
            date=self.date,  # استخدام تاريخ التحصيل/الدفع
            amount=contact_amount,
            transaction_type=transaction_effect,
            description=description,
            reference_number=self.number,
            balance_before=current_balance,
            balance_after=balance_after
        )

        if self.invoice:
            contact_transaction.invoice = self.invoice

        contact_transaction.save()
        self.contact_transaction = contact_transaction

        # 3. تحديث الفاتورة المرتبطة إذا وجدت
        if self.invoice:
            # تحديث المبلغ المدفوع والمتبقي في الفاتورة
            if self.payment_type == self.RECEIPT and self.invoice.invoice_type == 'sale':
                # تحصيل من العميل لفاتورة بيع
                self.invoice.paid_amount += self.amount
                self.invoice.remaining_amount = self.invoice.net_amount - self.invoice.paid_amount
                self.invoice.save(update_fields=['paid_amount', 'remaining_amount'])
            elif self.payment_type == self.PAYMENT and self.invoice.invoice_type == 'purchase':
                # دفع للمورد لفاتورة شراء
                self.invoice.paid_amount += self.amount
                self.invoice.remaining_amount = self.invoice.net_amount - self.invoice.paid_amount
                self.invoice.save(update_fields=['paid_amount', 'remaining_amount'])

        # حفظ التغييرات في الدفعة
        self.save(update_fields=['journal_entry', 'created_transaction', 'contact_transaction'])

        return True

    def post_payment(self):
        """ترحيل التحصيل/الدفع وإنشاء المعاملات المالية المرتبطة"""
        if self.is_posted and self.created_transaction:
            return False

        # التحقق من قفل الفترة المالية قبل البدء
        from accounting.models import FinancialPeriod
        if FinancialPeriod.is_date_locked(self.date):
            raise ValueError("لا يمكن ترحيل السند لأن الفترة المالية مغلقة")

        # استخدام دالة create_related_transactions لإنشاء المعاملات
        result = self.create_related_transactions()

        if result:
            self.is_posted = True
            self.save(update_fields=['is_posted'])

        return result

    def unpost_payment(self):
        """إلغاء ترحيل التحصيل/الدفع وحذف المعاملات المالية المرتبطة"""
        if not self.is_posted:
            return False

        # التحقق من قفل الفترة المالية قبل البدء
        from accounting.models import FinancialPeriod
        if FinancialPeriod.is_date_locked(self.date):
            raise ValueError("لا يمكن إلغاء ترحيل السند لأن الفترة المالية مغلقة")

        # إذا كان هناك قيد محاسبي، نتحقق منه أيضاً
        if self.journal_entry and FinancialPeriod.is_date_locked(self.journal_entry.date):
            raise ValueError("لا يمكن إلغاء ترحيل السند لأن الفترة المالية للقيد المحاسبي مغلقة")

        # تحديث الفاتورة المرتبطة إذا وجدت
        if self.invoice:
            # تحديث المبلغ المدفوع والمتبقي في الفاتورة
            if self.payment_type == self.RECEIPT and self.invoice.invoice_type == 'sale':
                # إلغاء تحصيل من العميل لفاتورة بيع
                self.invoice.paid_amount -= self.amount
                self.invoice.remaining_amount = self.invoice.net_amount - self.invoice.paid_amount
                self.invoice.save(update_fields=['paid_amount', 'remaining_amount'])
            elif self.payment_type == self.PAYMENT and self.invoice.invoice_type == 'purchase':
                # إلغاء دفع للمورد لفاتورة شراء
                self.invoice.paid_amount -= self.amount
                self.invoice.remaining_amount = self.invoice.net_amount - self.invoice.paid_amount
                self.invoice.save(update_fields=['paid_amount', 'remaining_amount'])

        # حذف القيد المحاسبي إذا وجد
        if self.journal_entry:
            # إذا كان القيد مرحلاً، يجب إلغاء ترحيله أولاً لتحديث أرصدة الحسابات
            if self.journal_entry.is_posted:
                if hasattr(self.journal_entry, 'unpost'):
                    self.journal_entry.unpost()
                else:
                    with transaction.atomic():
                        items = self.journal_entry.items.all()
                        for item in items:
                            account = item.account
                            if account.account_type in ['asset', 'expense']:
                                amount = (item.debit - item.credit)
                            else:
                                amount = (item.credit - item.debit)
                            
                            for acc in account.get_ancestors(include_self=True):
                                acc.balance -= amount
                                acc.save()
                    self.journal_entry.is_posted = False
                    self.journal_entry.save()
            
            self.journal_entry.delete()
            self.journal_entry = None

        # حذف معاملة الخزنة إذا وجدت
        if self.created_transaction:
            self.created_transaction.delete()
            self.created_transaction = None

        # حذف معاملة العميل/المورد إذا وجدت
        if self.contact_transaction:
            self.contact_transaction.delete()
            self.contact_transaction = None

        # تحديث حالة الترحيل
        self.is_posted = False
        self.save(update_fields=['is_posted', 'created_transaction', 'contact_transaction', 'journal_entry'])

        return True
