from django.db import models, transaction
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import Contact, Store, Safe, Representative, Driver
from products.models import Product, ProductUnit
from finances.models import SafeTransaction, ContactTransaction

class Invoice(models.Model):
    SALE = 'sale'
    PURCHASE = 'purchase'
    SALE_RETURN = 'sale_return'
    PURCHASE_RETURN = 'purchase_return'

    INVOICE_TYPE_CHOICES = [
        (SALE, _("بيع")),
        (PURCHASE, _("شراء")),
        (SALE_RETURN, _("مرتجع بيع")),
        (PURCHASE_RETURN, _("مرتجع شراء")),
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
    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='invoices', verbose_name=_("جهة الاتصال"))
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
        return f"{self.get_invoice_type_display()} {self.number} - {self.contact.name}"

    def save(self, *args, **kwargs):
        # حساب المبالغ
        self.net_amount = self.total_amount - self.discount_amount + self.tax_amount

        if self.payment_type == self.CASH:
            self.paid_amount = self.net_amount
            self.remaining_amount = 0
        else:
            self.remaining_amount = self.net_amount - self.paid_amount

        # التحقق مما إذا كانت الفاتورة جديدة
        is_new = self.pk is None

        # حفظ الفاتورة
        print(f"حفظ الفاتورة {self.number} - جديدة: {is_new}, مرحلة: {self.is_posted}")
        super().save(*args, **kwargs)

        # إذا كانت الفاتورة جديدة ومرحلة، قم بإنشاء المعاملات المالية والمخزنية
        if is_new and self.is_posted:
            print(f"الفاتورة {self.number} جديدة ومرحلة، جاري إنشاء المعاملات المالية والمخزنية...")
            # التحقق من وجود معاملات مالية ومخزنية مرتبطة بالفاتورة
            from finances.models import ContactTransaction, SafeTransaction, ProductTransaction

            contact_transactions = ContactTransaction.objects.filter(invoice=self)
            safe_transactions = SafeTransaction.objects.filter(invoice=self)
            product_transactions = ProductTransaction.objects.filter(invoice=self)

            if contact_transactions.count() == 0 and safe_transactions.count() == 0 and product_transactions.count() == 0:
                print(f"لا توجد معاملات مالية ومخزنية مرتبطة بالفاتورة {self.number}، جاري إنشاؤها...")
                try:
                    self.create_related_transactions()
                    print(f"تم إنشاء المعاملات المالية والمخزنية للفاتورة {self.number} بنجاح")
                except Exception as e:
                    print(f"خطأ في إنشاء المعاملات المالية والمخزنية للفاتورة {self.number}: {str(e)}")
            else:
                print(f"توجد معاملات مالية ومخزنية مرتبطة بالفاتورة {self.number} بالفعل")
                print(f"عدد معاملات العملاء/الموردين: {contact_transactions.count()}")
                print(f"عدد معاملات الخزنة: {safe_transactions.count()}")
                print(f"عدد معاملات المخزون: {product_transactions.count()}")

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

        print(f"=== بدء إنشاء المعاملات المالية والمخزنية للفاتورة رقم {self.number} ===")
        
        # إنشاء قيد محاسبي تلقائي
        journal_entry = JournalEntry.objects.create(
            entry_number=f"INV-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            date=self.date,
            description=f"قيد تلقائي للفاتورة رقم {self.number} - {self.get_invoice_type_display()}",
            reference=self.number
        )

        # منطق القيود المحاسبية بناءً على نوع الفاتورة
        # ملاحظة: هذا تبسيط للعملية المحاسبية، يجب تخصيصه حسب شجرة الحسابات الفعلية
        
        # 1. حساب المبيعات/المشتريات (استخدام الإعدادات)
        from core.models import SystemSettings
        settings = SystemSettings.get_settings()
        
        contact_account = self.contact.account if self.contact else None
        safe_account = self.safe.account if self.safe else None
        store_account = self.store.account if self.store else None

        if self.invoice_type == self.SALE:
            # 1. من حساب العميل (مدين) بكامل قيمة الفاتورة
            if contact_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=contact_account,
                    debit=self.net_amount,
                    memo=f"مديونية فاتورة مبيعات {self.number}"
                )
            
            # 2. إلى حساب المبيعات (دائن) بقيمة الفاتورة قبل الضريبة
            sales_acc = settings.sales_account
            if sales_acc:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=sales_acc,
                    credit=self.total_amount - self.discount_amount,
                    memo=f"مبيعات فاتورة {self.number}"
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

            # 4. تكلفة المبيعات والمخزون (الجرد المستمر)
            total_cost = 0
            for item in self.items.all():
                unit_cost = item.product_unit.purchase_price or 0
                total_cost += item.quantity * unit_cost

            if total_cost > 0:
                cogs_acc = settings.cogs_account
                inventory_acc = store_account
                
                if cogs_acc and inventory_acc:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=cogs_acc,
                        debit=total_cost,
                        memo=f"تكلفة بضاعة مباعة فاتورة {self.number}"
                    )
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=inventory_acc,
                        credit=total_cost,
                        memo=f"صرف مخزني فاتورة {self.number}"
                    )
            
            # 5. في حالة الدفع النقدي (قيد التحصيل)
            if self.payment_type == self.CASH and safe_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=safe_account,
                    debit=self.net_amount,
                    memo=f"تحصيل نقدي فاتورة {self.number}"
                )
                if contact_account:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=contact_account,
                        credit=self.net_amount,
                        memo=f"سداد نقدي فاتورة {self.number}"
                    )
        
        elif self.invoice_type == self.PURCHASE:
            # 1. من حساب المشتريات (مدين) بقيمة الفاتورة قبل الضريبة
            purch_acc = settings.purchases_account
            if purch_acc:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=purch_acc,
                    debit=self.total_amount - self.discount_amount,
                    memo=f"مشتريات فاتورة {self.number}"
                )

            # 2. من حساب ضريبة القيمة المضافة - مدخلات (مدين)
            if self.tax_amount > 0:
                vat_in_acc = settings.vat_input_account
                if vat_in_acc:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=vat_in_acc,
                        debit=self.tax_amount,
                        vat_rate=settings.vat_percentage,
                        vat_amount=self.tax_amount,
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
            
            # 4. تحديث المخزون (الجرد المستمر)
            inventory_acc = store_account
            if inventory_acc:
                # في حالة الشراء، تزيد قيمة المخزون
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=inventory_acc,
                    debit=self.total_amount - self.discount_amount,
                    memo=f"إضافة مخزنية فاتورة {self.number}"
                )
                # تخفيض حساب المشتريات (لأنه تم تحويله للمخزون)
                if purch_acc:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=purch_acc,
                        credit=self.total_amount - self.discount_amount,
                        memo=f"تسوية مشتريات إلى مخزون فاتورة {self.number}"
                    )

            # 5. في حالة الدفع النقدي
            if self.payment_type == self.CASH and safe_account:
                # من حساب المورد (مدين) إلى حساب الخزنة (دائن)
                if contact_account:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=contact_account,
                        debit=self.net_amount,
                        memo=f"سداد نقدي فاتورة {self.number}"
                    )
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=safe_account,
                    credit=self.net_amount,
                    memo=f"دفع نقدي فاتورة {self.number}"
                )

        # ترحيل القيد إذا كان متوازناً
        try:
            journal_entry.post()
            print(f"تم إنشاء وترحيل القيد المحاسبي رقم {journal_entry.entry_number}")
        except Exception as e:
            print(f"فشل ترحيل القيد التلقائي: {str(e)}")
            # في بيئة الإنتاج قد نرغب في عدم ترحيله وترك المراجعة للمحاسب


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
                contact_transactions.delete()
                safe_transactions.delete()
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
                expected_product_transactions = items_count

                if new_contact_transactions.count() == 0:
                    raise Exception("لم يتم إنشاء معاملات العملاء/الموردين")

                if (self.payment_type == 'cash' or self.paid_amount > 0) and new_safe_transactions.count() == 0:
                    raise Exception("لم يتم إنشاء معاملات الخزنة للفاتورة النقدية أو الفاتورة الآجلة مع دفعة جزئية")

                if new_product_transactions.count() != expected_product_transactions:
                    raise Exception(f"عدد معاملات المخزون ({new_product_transactions.count()}) لا يتطابق مع عدد بنود الفاتورة ({expected_product_transactions})")

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
                    ContactTransaction.objects.filter(invoice=self).delete()
                    SafeTransaction.objects.filter(invoice=self).delete()
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
                print(f"تحديث سعر البيع للمنتج {product.name} من {product_unit.sale_price} إلى {unit_price}")
                product_unit.sale_price = unit_price
                product_unit.save(update_fields=['sale_price'])
                print(f"تم تحديث سعر البيع للمنتج {product.name} إلى {product_unit.sale_price}")

        print(f"=== تم تحديث أسعار المنتجات للفاتورة {self.number} ===")

    def unpost_invoice(self):
        """إلغاء ترحيل الفاتورة (يتطلب إلغاء المعاملات المالية والمخزنية المرتبطة)"""
        if self.is_posted:
            # التحقق من إمكانية إلغاء الترحيل (قد تكون هناك معاملات لاحقة تعتمد عليها)
            # يمكن تنفيذ منطق أكثر تعقيدًا هنا للتحقق من إمكانية إلغاء الترحيل

            # حذف المعاملات المالية والمخزنية المرتبطة
            from finances.models import ContactTransaction, SafeTransaction, ProductTransaction

            with transaction.atomic():
                # حذف حركات المنتجات
                ProductTransaction.objects.filter(invoice=self).delete()

                # حذف حركات الحسابات
                ContactTransaction.objects.filter(invoice=self).delete()

                # حذف حركات الخزنة
                SafeTransaction.objects.filter(invoice=self).delete()

                # تحديث حالة الفاتورة
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
        self.discount_amount = self.total_price * (self.discount_percentage / 100)
        self.tax_amount = (self.total_price - self.discount_amount) * (self.tax_percentage / 100)
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
                              verbose_name=_("العميل/المورد"))
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='contact_payments',
                           verbose_name=_("الخزنة"))
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

    def save(self, *args, **kwargs):
        # حفظ النموذج أولاً
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # إذا كان جديدًا وليس له معاملة مرتبطة، قم بعملية الترحيل تلقائيًا
        if is_new and not self.created_transaction:
            self.post_payment()

    def create_related_transactions(self):
        """إنشاء المعاملات المالية المرتبطة بالدفعة"""
        from finances.models import ContactTransaction, SafeTransaction
        from accounting.models import JournalEntry, JournalItem

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

        # 1. إنشاء قيد محاسبي تلقائي
        journal_entry = JournalEntry.objects.create(
            entry_number=f"PAY-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            date=self.date,
            description=f"قيد تلقائي لسند {self.get_payment_type_display()} رقم {self.number}",
            reference=self.number
        )

        contact_account = self.contact.account
        safe_account = self.safe.account

        if self.payment_type == self.RECEIPT:
            # من حساب الخزنة (مدين) إلى حساب العميل (دائن)
            if safe_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=safe_account,
                    debit=self.amount,
                    memo=description
                )
            
            # إذا كان هناك قسم إيراد مربوط بحساب، نستخدم حسابه بدلاً من حساب العميل (أو بالإضافة له حسب السياسة)
            # هنا سنتبع سياسة: إذا وجد قسم إيراد، يكون هو الطرف الدائن
            credit_account = self.income_category.account if (self.income_category and self.income_category.account) else contact_account
            
            if credit_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=credit_account,
                    credit=self.amount,
                    memo=description
                )
        else:  # PAYMENT
            # من حساب المورد (مدين) إلى حساب الخزنة (دائن)
            
            # إذا كان هناك قسم مصروف مربوط بحساب، نستخدم حسابه بدلاً من حساب المورد
            debit_account = self.expense_category.account if (self.expense_category and self.expense_category.account) else contact_account
            
            if debit_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=debit_account,
                    debit=self.amount,
                    memo=description
                )
            if safe_account:
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=safe_account,
                    credit=self.amount,
                    memo=description
                )

        # ترحيل القيد
        try:
            journal_entry.post()
        except Exception as e:
            print(f"فشل ترحيل قيد السند: {str(e)}")

        # 2. إنشاء معاملة خزنة
        current_balance = self.safe.current_balance

        # تحديد تأثير العملية على رصيد الخزنة
        if self.payment_type == self.RECEIPT:
            # تحصيل من العميل يزيد رصيد الخزنة
            balance_after = current_balance + self.amount
        else:  # PAYMENT
            # دفع للمورد ينقص رصيد الخزنة
            balance_after = current_balance - self.amount

        safe_transaction = SafeTransaction(
            safe=self.safe,
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
        current_balance = self.contact.current_balance
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
        self.save(update_fields=['created_transaction', 'contact_transaction'])

        return True

    def post_payment(self):
        """ترحيل التحصيل/الدفع وإنشاء المعاملات المالية المرتبطة"""
        if self.is_posted and self.created_transaction:
            return False

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

        # تحديث الفاتورة المرتبطة إذا وجدت
        if self.invoice:
            # تحديث المبلغ المدفوع والمتبقي في الفاتورة
            if self.payment_type == self.RECEIPT and self.invoice.invoice_type == 'sale':
                # إلغاء تحصيل من العميل لفاتورة بيع
                self.invoice.paid_amount -= self.amount
                self.invoice.remaining_amount = self.invoice.net_amount - self.invoice.paid_amount
                self.invoice.save(update_fields=['paid_amount', 'remaining_amount'])
                print(f"تم تحديث الفاتورة {self.invoice.number} - المبلغ المدفوع: {self.invoice.paid_amount}, المبلغ المتبقي: {self.invoice.remaining_amount}")
            elif self.payment_type == self.PAYMENT and self.invoice.invoice_type == 'purchase':
                # إلغاء دفع للمورد لفاتورة شراء
                self.invoice.paid_amount -= self.amount
                self.invoice.remaining_amount = self.invoice.net_amount - self.invoice.paid_amount
                self.invoice.save(update_fields=['paid_amount', 'remaining_amount'])
                print(f"تم تحديث الفاتورة {self.invoice.number} - المبلغ المدفوع: {self.invoice.paid_amount}, المبلغ المتبقي: {self.invoice.remaining_amount}")

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
        self.save(update_fields=['is_posted', 'created_transaction', 'contact_transaction'])

        return True
