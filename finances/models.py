from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import Safe, Bank, Contact, Store, Representative, Driver
from products.models import Product, ProductUnit

class ExpenseCategory(models.Model):
    """أقسام المصروفات في النظام"""
    name = models.CharField(_("اسم القسم"), max_length=100)
    description = models.TextField(_("الوصف"), blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True,
                             related_name='children', verbose_name=_("القسم الأب"))
    account = models.OneToOneField('accounting.Account', on_delete=models.PROTECT, null=True, blank=True,
                                 related_name='expense_category', verbose_name=_("حساب الأستاذ"))

    class Meta:
        verbose_name = _("قسم المصروفات")
        verbose_name_plural = _("أقسام المصروفات")

    def __str__(self):
        return self.name

class IncomeCategory(models.Model):
    """أقسام الإيرادات في النظام"""
    name = models.CharField(_("اسم القسم"), max_length=100)
    description = models.TextField(_("الوصف"), blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True,
                             related_name='children', verbose_name=_("القسم الأب"))
    account = models.OneToOneField('accounting.Account', on_delete=models.PROTECT, null=True, blank=True,
                                 related_name='income_category', verbose_name=_("حساب الأستاذ"))

    class Meta:
        verbose_name = _("قسم الإيرادات")
        verbose_name_plural = _("أقسام الإيرادات")

    def __str__(self):
        return self.name

class SafeTransaction(models.Model):
    # أنواع العمليات المالية المتعلقة بالخزنة
    SALE_INVOICE = 'sale_invoice'
    PURCHASE_INVOICE = 'purchase_invoice'
    SALE_RETURN_INVOICE = 'sale_return_invoice'
    PURCHASE_RETURN_INVOICE = 'purchase_return_invoice'
    COLLECTION = 'collection'
    PAYMENT = 'payment'
    DEPOSIT = 'deposit'
    WITHDRAWAL = 'withdrawal'
    EXPENSE = 'expense'
    INCOME = 'income'

    TRANSACTION_TYPE_CHOICES = [
        (SALE_INVOICE, _("فاتورة بيع")),
        (PURCHASE_INVOICE, _("فاتورة شراء")),
        (SALE_RETURN_INVOICE, _("مرتجع بيع")),
        (PURCHASE_RETURN_INVOICE, _("مرتجع شراء")),
        (COLLECTION, _("تحصيل")),
        (PAYMENT, _("دفع")),
        (DEPOSIT, _("إيداع")),
        (WITHDRAWAL, _("سحب")),
        (EXPENSE, _("مصروف")),
        (INCOME, _("إيراد")),
    ]

    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transactions', verbose_name=_("الخزنة"), null=True, blank=True)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='transactions', verbose_name=_("البنك"), null=True, blank=True)
    date = models.DateTimeField(_("تاريخ العملية"), default=timezone.now)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    transaction_type = models.CharField(_("نوع العملية"), max_length=25, choices=TRANSACTION_TYPE_CHOICES)
    description = models.TextField(_("الوصف"), blank=True, null=True)
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, related_name='safe_transactions',
                              verbose_name=_("الفاتورة"), null=True, blank=True)
    contact = models.ForeignKey(Contact, on_delete=models.SET_NULL, related_name='safe_transactions',
                              verbose_name=_("جهة الاتصال"), null=True, blank=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    balance_before = models.DecimalField(_("الرصيد قبل العملية"), max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(_("الرصيد بعد العملية"), max_digits=15, decimal_places=2)

    class Meta:
        verbose_name = _("حركة مالية")
        verbose_name_plural = _("حركات مالية")
        ordering = ['date']  # ترتيب الحركات حسب التاريخ تصاعديًا للحصول على تسلسل صحيح

    def __str__(self):
        obj_name = self.safe.name if self.safe else self.bank.name
        return f"{self.get_transaction_type_display()} - {obj_name} - {self.amount}"

    def set_transaction_type_from_invoice(self):
        """تحديد نوع العملية بناءً على نوع الفاتورة المرتبطة"""
        if self.invoice:
            if self.invoice.invoice_type == 'sale':
                self.transaction_type = self.SALE_INVOICE
            elif self.invoice.invoice_type == 'purchase':
                self.transaction_type = self.PURCHASE_INVOICE
            elif self.invoice.invoice_type == 'sale_return':
                self.transaction_type = self.SALE_RETURN_INVOICE
            elif self.invoice.invoice_type == 'purchase_return':
                self.transaction_type = self.PURCHASE_RETURN_INVOICE

    @staticmethod
    def recalculate_balances(obj):
        """
        إعادة حساب أرصدة جميع حركات الخزنة أو البنك من البداية
        """
        from django.db import transaction

        is_safe = isinstance(obj, Safe)
        
        with transaction.atomic():
            # الحصول على جميع حركات الخزنة أو البنك مرتبة حسب التاريخ
            if is_safe:
                transactions = SafeTransaction.objects.filter(safe=obj).order_by('date')
            else:
                transactions = SafeTransaction.objects.filter(bank=obj).order_by('date')

            # إعادة تعيين الرصيد إلى الرصيد الافتتاحي
            current_balance = obj.initial_balance

            # طباعة معلومات تصحيح الأخطاء
            print(f"إعادة حساب أرصدة {obj.name} - الرصيد الافتتاحي: {current_balance}")

            # إعادة حساب الأرصدة لكل حركة
            for trans in transactions:
                # تحديث الرصيد قبل العملية
                trans.balance_before = current_balance

                # إعادة حساب الرصيد بعد العملية بناءً على نوع العملية
                if trans.transaction_type in [SafeTransaction.SALE_INVOICE, SafeTransaction.COLLECTION, SafeTransaction.DEPOSIT, SafeTransaction.INCOME]:
                    # عمليات تزيد الرصيد
                    trans.balance_after = trans.balance_before + trans.amount
                elif trans.transaction_type in [SafeTransaction.PURCHASE_INVOICE, SafeTransaction.PAYMENT, SafeTransaction.WITHDRAWAL, SafeTransaction.EXPENSE]:
                    # عمليات تنقص الرصيد
                    trans.balance_after = trans.balance_before - trans.amount
                elif trans.transaction_type == SafeTransaction.SALE_RETURN_INVOICE:
                    # مرتجع بيع ينقص الرصيد
                    trans.balance_after = trans.balance_before - trans.amount
                elif trans.transaction_type == SafeTransaction.PURCHASE_RETURN_INVOICE:
                    # مرتجع شراء يزيد الرصيد
                    trans.balance_after = trans.balance_before + trans.amount

                # تحديث الرصيد الحالي للحركة التالية
                current_balance = trans.balance_after

                # حفظ التغييرات بدون استدعاء دالة save المخصصة
                SafeTransaction.objects.filter(pk=trans.pk).update(
                    balance_before=trans.balance_before,
                    balance_after=trans.balance_after
                )

            # تحديث الرصيد النهائي
            if transactions.exists():
                obj.current_balance = transactions.last().balance_after
            else:
                obj.current_balance = obj.initial_balance

            obj.save(update_fields=['current_balance'])

            return obj.current_balance

    def save(self, *args, **kwargs):
        # تحديد نوع العملية من الفاتورة إذا كانت متوفرة
        if self.invoice and not self.transaction_type:
            self.set_transaction_type_from_invoice()

        # حفظ الحركة أولاً
        super().save(*args, **kwargs)

        # إعادة حساب جميع الأرصدة من البداية
        if self.safe:
            SafeTransaction.recalculate_balances(self.safe)
        elif self.bank:
            SafeTransaction.recalculate_balances(self.bank)

    def delete(self, *args, **kwargs):
        """
        تجاوز دالة الحذف الافتراضية لإعادة حساب الأرصدة
        """
        from django.db import transaction

        with transaction.atomic():
            # حفظ المعلومات المطلوبة قبل الحذف
            obj = self.safe or self.bank

            # حذف العملية الحالية
            super().delete(*args, **kwargs)

            # إعادة حساب جميع الأرصدة من البداية
            if obj:
                SafeTransaction.recalculate_balances(obj)

class ContactTransaction(models.Model):
    # أنواع العمليات المتعلقة بحسابات العملاء والموردين
    SALE_INVOICE = 'sale_invoice'
    PURCHASE_INVOICE = 'purchase_invoice'
    SALE_RETURN_INVOICE = 'sale_return_invoice'
    PURCHASE_RETURN_INVOICE = 'purchase_return_invoice'
    COLLECTION = 'collection'
    PAYMENT = 'payment'

    TRANSACTION_TYPE_CHOICES = [
        (SALE_INVOICE, _("فاتورة بيع")),
        (PURCHASE_INVOICE, _("فاتورة شراء")),
        (SALE_RETURN_INVOICE, _("مرتجع بيع")),
        (PURCHASE_RETURN_INVOICE, _("مرتجع شراء")),
        (COLLECTION, _("تحصيل")),
        (PAYMENT, _("دفع")),
    ]

    contact = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='transactions', verbose_name=_("جهة الاتصال"))
    date = models.DateTimeField(_("تاريخ العملية"), default=timezone.now)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    transaction_type = models.CharField(_("نوع العملية"), max_length=25, choices=TRANSACTION_TYPE_CHOICES)
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, related_name='contact_transactions',
                              verbose_name=_("الفاتورة"), null=True, blank=True)
    description = models.TextField(_("الوصف"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    balance_before = models.DecimalField(_("الرصيد قبل العملية"), max_digits=15, decimal_places=2)
    balance_after = models.DecimalField(_("الرصيد بعد العملية"), max_digits=15, decimal_places=2)

    class Meta:
        verbose_name = _("حركة حساب")
        verbose_name_plural = _("حركات الحسابات")
        ordering = ['date']  # ترتيب الحركات حسب التاريخ تصاعديًا للحصول على تسلسل صحيح

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.contact.name} - {self.amount}"

    def set_transaction_type_from_invoice(self):
        """تحديد نوع العملية بناءً على نوع الفاتورة المرتبطة"""
        if self.invoice:
            if self.invoice.invoice_type == 'sale':
                self.transaction_type = self.SALE_INVOICE
            elif self.invoice.invoice_type == 'purchase':
                self.transaction_type = self.PURCHASE_INVOICE
            elif self.invoice.invoice_type == 'sale_return':
                self.transaction_type = self.SALE_RETURN_INVOICE
            elif self.invoice.invoice_type == 'purchase_return':
                self.transaction_type = self.PURCHASE_RETURN_INVOICE

    @staticmethod
    def recalculate_balances(contact):
        """
        إعادة حساب أرصدة جميع حركات الحساب لجهة اتصال معينة من البداية
        """
        from django.db import transaction

        with transaction.atomic():
            # الحصول على جميع حركات الحساب لجهة الاتصال مرتبة حسب التاريخ
            transactions = ContactTransaction.objects.filter(contact=contact).order_by('date')

            # إعادة تعيين رصيد جهة الاتصال إلى الرصيد الافتتاحي
            current_balance = contact.initial_balance

            # طباعة معلومات تصحيح الأخطاء
            print(f"إعادة حساب أرصدة {contact.name} - الرصيد الافتتاحي: {current_balance}")

            # إعادة حساب الأرصدة لكل حركة
            for trans in transactions:
                # تحديث الرصيد قبل العملية
                old_balance_before = trans.balance_before
                old_balance_after = trans.balance_after

                trans.balance_before = current_balance

                # إعادة حساب الرصيد بعد العملية بناءً على نوع العملية
                if contact.contact_type == Contact.CUSTOMER:
                    # العمليات المتعلقة بالعملاء
                    if trans.transaction_type == ContactTransaction.SALE_INVOICE:
                        # فاتورة بيع تزيد مديونية العميل
                        trans.balance_after = trans.balance_before + trans.amount
                    elif trans.transaction_type == ContactTransaction.SALE_RETURN_INVOICE:
                        # مرتجع بيع ينقص مديونية العميل
                        trans.balance_after = trans.balance_before - trans.amount
                    elif trans.transaction_type == ContactTransaction.COLLECTION:
                        # تحصيل من العميل ينقص مديونيته
                        trans.balance_after = trans.balance_before - trans.amount
                    else:
                        # أي عملية أخرى لا تؤثر على الرصيد
                        trans.balance_after = trans.balance_before
                else:
                    # العمليات المتعلقة بالموردين
                    if trans.transaction_type == ContactTransaction.PURCHASE_INVOICE:
                        # فاتورة شراء تزيد الالتزام تجاه المورد
                        trans.balance_after = trans.balance_before + trans.amount
                    elif trans.transaction_type == ContactTransaction.PURCHASE_RETURN_INVOICE:
                        # مرتجع شراء ينقص الالتزام تجاه المورد
                        trans.balance_after = trans.balance_before - trans.amount
                    elif trans.transaction_type == ContactTransaction.PAYMENT:
                        # دفع للمورد ينقص الالتزام تجاهه
                        trans.balance_after = trans.balance_before - trans.amount
                    else:
                        # أي عملية أخرى لا تؤثر على الرصيد
                        trans.balance_after = trans.balance_before

                # طباعة معلومات تصحيح الأخطاء
                print(f"العملية: {trans.get_transaction_type_display()} - المبلغ: {trans.amount}")
                print(f"الرصيد قبل (قديم): {old_balance_before} - الرصيد بعد (قديم): {old_balance_after}")
                print(f"الرصيد قبل (جديد): {trans.balance_before} - الرصيد بعد (جديد): {trans.balance_after}")
                print("---")

                # تحديث الرصيد الحالي للحركة التالية
                current_balance = trans.balance_after

                # حفظ التغييرات بدون استدعاء دالة save المخصصة
                ContactTransaction.objects.filter(pk=trans.pk).update(
                    balance_before=trans.balance_before,
                    balance_after=trans.balance_after
                )

            # تحديث رصيد جهة الاتصال النهائي
            if transactions.exists():
                contact.current_balance = transactions.last().balance_after
            else:
                contact.current_balance = contact.initial_balance

            contact.save(update_fields=['current_balance'])

            # طباعة معلومات تصحيح الأخطاء
            print(f"الرصيد النهائي لـ {contact.name}: {contact.current_balance}")

            return contact.current_balance

    def save(self, *args, **kwargs):
        # تحديد نوع العملية من الفاتورة إذا كانت متوفرة
        if self.invoice and not self.transaction_type:
            self.set_transaction_type_from_invoice()

        # حفظ الحركة أولاً
        super().save(*args, **kwargs)

        # إعادة حساب جميع الأرصدة من البداية
        ContactTransaction.recalculate_balances(self.contact)

    def delete(self, *args, **kwargs):
        """
        تجاوز دالة الحذف الافتراضية لإعادة حساب الأرصدة
        """
        from django.db import transaction

        with transaction.atomic():
            # حفظ المعلومات المطلوبة قبل الحذف
            contact = self.contact

            # حذف العملية الحالية
            super().delete(*args, **kwargs)

            # إعادة حساب جميع الأرصدة من البداية
            ContactTransaction.recalculate_balances(contact)

class ProductTransaction(models.Model):
    # أنواع حركات المنتجات
    SALE = 'sale'
    PURCHASE = 'purchase'
    SALE_RETURN = 'sale_return'
    PURCHASE_RETURN = 'purchase_return'
    ADJUSTMENT = 'adjustment'

    TRANSACTION_TYPE_CHOICES = [
        (SALE, _("بيع")),
        (PURCHASE, _("شراء")),
        (SALE_RETURN, _("مرتجع بيع")),
        (PURCHASE_RETURN, _("مرتجع شراء")),
        (ADJUSTMENT, _("تسوية مخزون")),
    ]

    @property
    def quantity_display(self):
        """عرض الكمية بالوحدة الكبرى والصغرى معًا"""
        # البحث عن الوحدة الافتراضية (الأساسية) للمنتج
        try:
            base_unit = self.product.units.get(conversion_factor=1)
            # محاولة العثور على الوحدة الكبرى (ذات أكبر معامل تحويل)
            main_unit = self.product.units.exclude(id=base_unit.id).order_by('-conversion_factor').first()

            if not main_unit:
                # إذا لم يكن هناك وحدة كبرى، فقط نعرض الكمية بالوحدة الحالية
                return self._format_number_display(self.quantity, self.product_unit.unit.name)

            # حساب القيم بالوحدة الكبرى والمتبقي
            main_unit_factor = main_unit.conversion_factor
            base_quantity = self.base_quantity

            main_unit_count = int(base_quantity / main_unit_factor)
            remaining = base_quantity % main_unit_factor

            # تنسيق النص - تحويل الأرقام إلى أرقام صحيحة إذا كانت بدون كسور
            remaining_formatted = self._format_number(remaining)

            # تنسيق النص
            if main_unit_count > 0 and remaining > 0:
                return f"{main_unit_count} {main_unit.unit.name} و {remaining_formatted} {base_unit.unit.name}"
            elif main_unit_count > 0:
                return f"{main_unit_count} {main_unit.unit.name}"
            else:
                return f"{remaining_formatted} {base_unit.unit.name}"
        except:
            # في حالة حدوث أي خطأ، نعرض الكمية بالوحدة الحالية
            return self._format_number_display(self.quantity, self.product_unit.unit.name)

    @property
    def balance_display(self):
        """عرض الرصيد بعد العملية بالوحدة الكبرى والصغرى معًا"""
        # البحث عن الوحدة الافتراضية (الأساسية) للمنتج
        try:
            base_unit = self.product.units.get(conversion_factor=1)
            # محاولة العثور على الوحدة الكبرى (ذات أكبر معامل تحويل)
            main_unit = self.product.units.exclude(id=base_unit.id).order_by('-conversion_factor').first()

            if not main_unit:
                # إذا لم يكن هناك وحدة كبرى، فقط نعرض الرصيد بالوحدة الأساسية
                return self._format_number_display(self.balance_after, base_unit.unit.name)

            # حساب القيم بالوحدة الكبرى والمتبقي
            main_unit_factor = main_unit.conversion_factor
            balance = self.balance_after

            main_unit_count = int(balance / main_unit_factor)
            remaining = balance % main_unit_factor

            # تنسيق النص - تحويل الأرقام إلى أرقام صحيحة إذا كانت بدون كسور
            remaining_formatted = self._format_number(remaining)

            # تنسيق النص
            if main_unit_count > 0 and remaining > 0:
                return f"{main_unit_count} {main_unit.unit.name} و {remaining_formatted} {base_unit.unit.name}"
            elif main_unit_count > 0:
                return f"{main_unit_count} {main_unit.unit.name}"
            else:
                return f"{remaining_formatted} {base_unit.unit.name}"
        except:
            # في حالة حدوث أي خطأ، نعرض الرصيد بدون وحدة
            return self._format_number(self.balance_after)

    def _format_number(self, number):
        """تنسيق الرقم بحيث يتم عرضه كعدد صحيح إذا كان بدون كسور"""
        if number == int(number):
            # إذا كان الرقم عددًا صحيحًا، نعرضه بدون نقطة عشرية
            return str(int(number))
        else:
            # إذا كان به كسور، نستخدم الرقم العشري
            return str(number)

    def _format_number_display(self, number, unit_name):
        """تنسيق الرقم والوحدة معًا"""
        formatted_number = self._format_number(number)
        return f"{formatted_number} {unit_name}"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='transactions', verbose_name=_("المنتج"))
    date = models.DateTimeField(_("تاريخ العملية"), default=timezone.now)
    quantity = models.DecimalField(_("الكمية"), max_digits=15, decimal_places=3)
    product_unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE, related_name='transactions', verbose_name=_("وحدة المنتج"))
    base_quantity = models.DecimalField(_("الكمية بالوحدة الأساسية"), max_digits=15, decimal_places=3)
    transaction_type = models.CharField(_("نوع العملية"), max_length=20, choices=TRANSACTION_TYPE_CHOICES)
    invoice = models.ForeignKey('invoices.Invoice', on_delete=models.SET_NULL, related_name='product_transactions',
                              verbose_name=_("الفاتورة"), null=True, blank=True)
    store = models.ForeignKey('core.Store', on_delete=models.CASCADE, related_name='product_transactions',
                            verbose_name=_("المخزن"), default=1)
    description = models.TextField(_("الوصف"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    balance_before = models.DecimalField(_("الرصيد قبل العملية"), max_digits=15, decimal_places=3)
    balance_after = models.DecimalField(_("الرصيد بعد العملية"), max_digits=15, decimal_places=3)

    class Meta:
        verbose_name = _("حركة منتج")
        verbose_name_plural = _("حركات المنتجات")
        ordering = ['date']  # ترتيب الحركات حسب التاريخ تصاعديًا للحصول على تسلسل صحيح

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.product.name} - {self.quantity}"

    def set_transaction_type_from_invoice(self):
        """تحديد نوع حركة المنتج بناءً على نوع الفاتورة المرتبطة"""
        if self.invoice:
            self.transaction_type = self.invoice.invoice_type

    @staticmethod
    def recalculate_balances(product):
        """
        إعادة حساب أرصدة جميع حركات المنتج لمنتج معين من البداية
        """
        from django.db import transaction

        with transaction.atomic():
            # الحصول على جميع حركات المنتج مرتبة حسب التاريخ
            transactions = ProductTransaction.objects.filter(product=product).order_by('date')

            # إعادة تعيين رصيد المنتج إلى الرصيد الافتتاحي
            current_balance = product.initial_balance

            # طباعة معلومات تصحيح الأخطاء
            print(f"إعادة حساب أرصدة المنتج {product.name} - الرصيد الافتتاحي: {current_balance}")

            # إعادة حساب الأرصدة لكل حركة
            for trans in transactions:
                # تحديث الرصيد قبل العملية
                old_balance_before = trans.balance_before
                old_balance_after = trans.balance_after

                trans.balance_before = current_balance

                # إعادة حساب الرصيد بعد العملية بناءً على نوع العملية
                if trans.transaction_type in [ProductTransaction.SALE, ProductTransaction.PURCHASE_RETURN]:
                    # عمليات تنقص المخزون
                    trans.balance_after = trans.balance_before - trans.base_quantity
                elif trans.transaction_type == ProductTransaction.ADJUSTMENT:
                    # في حالة التسوية، نعتمد على إشارة base_quantity
                    # إذا كانت موجبة فهي زيادة، وإذا كانت سالبة فهي نقصان
                    trans.balance_after = trans.balance_before + trans.base_quantity
                else:
                    # عمليات تزيد المخزون (PURCHASE, SALE_RETURN)
                    trans.balance_after = trans.balance_before + trans.base_quantity

                # طباعة معلومات تصحيح الأخطاء
                print(f"العملية: {trans.get_transaction_type_display()} - الكمية: {trans.quantity} {trans.product_unit.unit.name} - الكمية الأساسية: {trans.base_quantity}")
                print(f"الرصيد قبل (جديد): {trans.balance_before} - الرصيد بعد (جديد): {trans.balance_after}")
                print("---")

                # تحديث الرصيد الحالي للحركة التالية
                current_balance = trans.balance_after

                # حفظ التغييرات بدون استدعاء دالة save المخصصة
                ProductTransaction.objects.filter(pk=trans.pk).update(
                    balance_before=trans.balance_before,
                    balance_after=trans.balance_after
                )

            # تحديث رصيد المنتج النهائي
            if transactions.exists():
                product.current_balance = transactions.last().balance_after
            else:
                product.current_balance = product.initial_balance

            product.save(update_fields=['current_balance'])

            # طباعة معلومات تصحيح الأخطاء
            print(f"الرصيد النهائي للمنتج {product.name}: {product.current_balance}")

            return product.current_balance

    def save(self, *args, **kwargs):
        # تحديد نوع العملية من الفاتورة إذا كانت متوفرة
        if self.invoice and not self.transaction_type:
            self.set_transaction_type_from_invoice()

        # تحويل الكمية إلى الوحدة الأساسية
        self.base_quantity = self.quantity * self.product_unit.conversion_factor

        # حفظ الحركة أولاً
        super().save(*args, **kwargs)

        # إعادة حساب جميع الأرصدة من البداية
        ProductTransaction.recalculate_balances(self.product)

    def delete(self, *args, **kwargs):
        """
        تجاوز دالة الحذف الافتراضية لإعادة حساب الأرصدة
        """
        from django.db import transaction

        with transaction.atomic():
            # حفظ المعلومات المطلوبة قبل الحذف
            product = self.product

            # حذف العملية الحالية
            super().delete(*args, **kwargs)

            # إعادة حساب جميع الأرصدة من البداية
            ProductTransaction.recalculate_balances(product)


# تم نقل نموذج StorePermit إلى نهاية الملف


# تم نقل نموذج StorePermitItem إلى نهاية الملف


# الاحتفاظ بالنماذج القديمة مؤقتًا للهجرة
class StoreIssue(models.Model):
    """نموذج صرف المنتجات من المخزن (قديم)"""

    number = models.CharField(_("رقم المستند"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='issues',
                            verbose_name=_("المخزن"))
    recipient = models.CharField(_("المستلم"), max_length=255)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, related_name='store_issues',
                             verbose_name=_("السائق"), null=True, blank=True)
    representative = models.ForeignKey(Representative, on_delete=models.SET_NULL, related_name='store_issues',
                                     verbose_name=_("المندوب"), null=True, blank=True)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # معرف حركات المنتجات التي تم إنشاؤها بواسطة هذا الصرف
    created_transactions = models.ManyToManyField(ProductTransaction, blank=True, related_name='created_by_issue',
                                              verbose_name=_("حركات المنتجات المنشأة"))

    class Meta:
        verbose_name = _("صرف من المخزن (قديم)")
        verbose_name_plural = _("عمليات الصرف من المخازن (قديم)")

    def __str__(self):
        return f"{self.number} - {self.store.name} - {self.date}"


class StoreIssueItem(models.Model):
    """نموذج بند صرف المنتجات من المخزن (قديم)"""

    issue = models.ForeignKey(StoreIssue, on_delete=models.CASCADE, related_name='items',
                            verbose_name=_("مستند الصرف"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='issue_items',
                              verbose_name=_("المنتج"))
    product_unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE, related_name='issue_items',
                                   verbose_name=_("وحدة المنتج"))
    quantity = models.DecimalField(_("الكمية"), max_digits=15, decimal_places=3)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)

    class Meta:
        verbose_name = _("بند صرف (قديم)")
        verbose_name_plural = _("بنود الصرف (قديم)")

    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.product_unit.unit.name}"


class StoreReceive(models.Model):
    """نموذج استلام المنتجات في المخزن (قديم)"""

    number = models.CharField(_("رقم المستند"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='receives',
                            verbose_name=_("المخزن"))
    sender = models.CharField(_("المرسل"), max_length=255)
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, related_name='store_receives',
                             verbose_name=_("السائق"), null=True, blank=True)
    representative = models.ForeignKey(Representative, on_delete=models.SET_NULL, related_name='store_receives',
                                     verbose_name=_("المندوب"), null=True, blank=True)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # معرف حركات المنتجات التي تم إنشاؤها بواسطة هذا الاستلام
    created_transactions = models.ManyToManyField(ProductTransaction, blank=True, related_name='created_by_receive',
                                              verbose_name=_("حركات المنتجات المنشأة"))

    class Meta:
        verbose_name = _("استلام في المخزن (قديم)")
        verbose_name_plural = _("عمليات الاستلام في المخازن (قديم)")

    def __str__(self):
        return f"{self.number} - {self.store.name} - {self.date}"


class StoreReceiveItem(models.Model):
    """نموذج بند استلام المنتجات في المخزن (قديم)"""

    receive = models.ForeignKey(StoreReceive, on_delete=models.CASCADE, related_name='items',
                              verbose_name=_("مستند الاستلام"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='receive_items',
                              verbose_name=_("المنتج"))
    product_unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE, related_name='receive_items',
                                   verbose_name=_("وحدة المنتج"))
    quantity = models.DecimalField(_("الكمية"), max_digits=15, decimal_places=3)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)

    class Meta:
        verbose_name = _("بند استلام (قديم)")
        verbose_name_plural = _("بنود الاستلام (قديم)")

    def __str__(self):
        return f"{self.product.name} - {self.quantity} {self.product_unit.unit.name}"

class Expense(models.Model):
    """نموذج المصروفات في النظام"""

    number = models.CharField(_("رقم المستند"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    vat_amount = models.DecimalField(_("قيمة الضريبة"), max_digits=15, decimal_places=2, default=0)
    cost_center = models.ForeignKey('accounting.CostCenter', on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='expenses', verbose_name=_("مركز التكلفة"))
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name='expenses',
                               verbose_name=_("قسم المصروفات"))
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='expenses',
                           verbose_name=_("الخزنة"), null=True, blank=True)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='expenses',
                           verbose_name=_("البنك"), null=True, blank=True)
    payee = models.CharField(_("المستفيد"), max_length=255)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # معرف حركة الخزنة التي تم إنشاؤها بواسطة هذا المصروف
    created_transaction = models.OneToOneField(SafeTransaction, on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='created_by_expense',
                                         verbose_name=_("حركة الخزنة المنشأة"))

    class Meta:
        verbose_name = _("مصروف")
        verbose_name_plural = _("المصروفات")

    def __str__(self):
        return f"{self.number} - {self.category.name} - {self.amount}"

    def save(self, *args, **kwargs):
        # حفظ النموذج أولاً
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # إذا كان جديدًا وليس له معاملة مرتبطة، قم بعملية الترحيل تلقائيًا
        if is_new and not self.created_transaction:
            self.post_expense()

    def post_expense(self):
        """ترحيل المصروف وإنشاء المعاملة المالية المرتبطة والقيود المحاسبية"""
        if self.is_posted and self.created_transaction:
            return False

        from django.db import transaction
        from accounting.models import JournalEntry, JournalItem
        from core.models import SystemSettings

        settings = SystemSettings.get_settings()
        total_with_vat = self.amount + self.vat_amount
        financial_obj = self.safe or self.bank
        
        if not financial_obj:
            return False

        with transaction.atomic():
            # إنشاء حركة الخزنة أو البنك
            current_balance = financial_obj.current_balance
            # المصروفات تنقص رصيد الخزنة أو البنك (بالمبلغ الإجمالي)
            balance_after = current_balance - total_with_vat

            safe_transaction = SafeTransaction(
                safe=self.safe,
                bank=self.bank,
                date=self.date,
                amount=total_with_vat,
                transaction_type=SafeTransaction.EXPENSE,
                description=f"مصروف: {self.category.name} - {self.payee}",
                reference_number=self.number,
                balance_before=current_balance,
                balance_after=balance_after
            )
            safe_transaction.save()
            self.created_transaction = safe_transaction

            # إنشاء القيد المحاسبي التلقائي
            expense_acc = self.category.account or settings.default_expense_account
            if expense_acc and financial_obj.account:
                journal_entry = JournalEntry.objects.create(
                    entry_number=f"EXP-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    date=self.date,
                    description=f"قيد مصروف تلقائي: {self.category.name} - {self.payee}",
                    reference=self.number
                )

                # 1. من حساب المصروف (الجانب المدين) - المبلغ بدون ضريبة
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=expense_acc,
                    debit=self.amount,
                    cost_center=self.cost_center,
                    memo=f"مصروف {self.category.name} مستلم بواسطة {self.payee}"
                )

                # 2. من حساب ضريبة المدخلات (إذا وجدت ضريبة)
                if self.vat_amount > 0 and settings.vat_input_account:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=settings.vat_input_account,
                        debit=self.vat_amount,
                        memo=f"ضريبة قيمة مضافة على مصروف {self.number}"
                    )

                # 3. إلى حساب الخزنة أو البنك (الجانب الدائن) - المبلغ الإجمالي
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=financial_obj.account,
                    credit=total_with_vat,
                    memo=f"صرف نقدي للمصروف {self.number}"
                )

                journal_entry.post()

            # تحديث حالة الترحيل
            self.is_posted = True
            self.save(update_fields=['is_posted', 'created_transaction'])

        return True

    def unpost_expense(self):
        """إلغاء ترحيل المصروف وحذف المعاملة المالية المرتبطة"""
        if not self.is_posted:
            return False

        # حذف حركة الخزنة إذا وجدت
        if self.created_transaction:
            self.created_transaction.delete()
            self.created_transaction = None

        # تحديث حالة الترحيل
        self.is_posted = False
        self.save(update_fields=['is_posted', 'created_transaction'])

        return True

class Income(models.Model):
    """نموذج الإيرادات في النظام"""

    number = models.CharField(_("رقم المستند"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    vat_amount = models.DecimalField(_("قيمة الضريبة"), max_digits=15, decimal_places=2, default=0)
    cost_center = models.ForeignKey('accounting.CostCenter', on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='incomes', verbose_name=_("مركز التكلفة"))
    category = models.ForeignKey(IncomeCategory, on_delete=models.PROTECT, related_name='incomes',
                               verbose_name=_("قسم الإيرادات"))
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='incomes',
                           verbose_name=_("الخزنة"), null=True, blank=True)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='incomes',
                           verbose_name=_("البنك"), null=True, blank=True)
    payer = models.CharField(_("الدافع"), max_length=255)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # معرف حركة الخزنة التي تم إنشاؤها بواسطة هذا الإيراد
    created_transaction = models.OneToOneField(SafeTransaction, on_delete=models.SET_NULL,
                                         null=True, blank=True, related_name='created_by_income',
                                         verbose_name=_("حركة الخزنة المنشأة"))

    class Meta:
        verbose_name = _("إيراد")
        verbose_name_plural = _("الإيرادات")

    def __str__(self):
        return f"{self.number} - {self.category.name} - {self.amount}"

    def save(self, *args, **kwargs):
        # حفظ النموذج أولاً
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # إذا كان جديدًا وليس له معاملة مرتبطة، قم بعملية الترحيل تلقائيًا
        if is_new and not self.created_transaction:
            self.post_income()

    def post_income(self):
        """ترحيل الإيراد وإنشاء المعاملة المالية المرتبطة والقيود المحاسبية"""
        if self.is_posted and self.created_transaction:
            return False

        from django.db import transaction
        from accounting.models import JournalEntry, JournalItem
        from core.models import SystemSettings

        settings = SystemSettings.get_settings()
        total_with_vat = self.amount + self.vat_amount
        financial_obj = self.safe or self.bank

        if not financial_obj:
            return False

        with transaction.atomic():
            # إنشاء حركة الخزنة أو البنك
            current_balance = financial_obj.current_balance
            # الإيرادات تزيد رصيد الخزنة أو البنك (بالمبلغ الإجمالي)
            balance_after = current_balance + total_with_vat

            safe_transaction = SafeTransaction(
                safe=self.safe,
                bank=self.bank,
                date=self.date,
                amount=total_with_vat,
                transaction_type=SafeTransaction.INCOME,
                description=f"إيراد: {self.category.name} - {self.payer}",
                reference_number=self.number,
                balance_before=current_balance,
                balance_after=balance_after
            )
            safe_transaction.save()
            self.created_transaction = safe_transaction

            # إنشاء القيد المحاسبي التلقائي
            income_acc = self.category.account or settings.default_income_account
            if income_acc and financial_obj.account:
                journal_entry = JournalEntry.objects.create(
                    entry_number=f"INC-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    date=self.date,
                    description=f"قيد إيراد تلقائي: {self.category.name} - {self.payer}",
                    reference=self.number
                )

                # 1. من حساب الخزنة أو البنك (الجانب المدين) - المبلغ الإجمالي
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=financial_obj.account,
                    debit=total_with_vat,
                    memo=f"تحصيل نقدي للإيراد {self.number}"
                )

                # 2. إلى حساب الإيراد (الجانب الدائن) - المبلغ بدون ضريبة
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=income_acc,
                    credit=self.amount,
                    cost_center=self.cost_center,
                    memo=f"إيراد {self.category.name} من {self.payer}"
                )

                # 3. إلى حساب ضريبة المخرجات (إذا وجدت ضريبة)
                if self.vat_amount > 0 and settings.vat_output_account:
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=settings.vat_output_account,
                        credit=self.vat_amount,
                        memo=f"ضريبة قيمة مضافة على إيراد {self.number}"
                    )

                journal_entry.post()

            # تحديث حالة الترحيل
            self.is_posted = True
            self.save(update_fields=['is_posted', 'created_transaction'])

        return True

    def unpost_income(self):
        """إلغاء ترحيل الإيراد وحذف المعاملة المالية المرتبطة"""
        if not self.is_posted:
            return False

        # حذف حركة الخزنة إذا وجدت
        if self.created_transaction:
            self.created_transaction.delete()
            self.created_transaction = None

        # تحديث حالة الترحيل
        self.is_posted = False
        self.save(update_fields=['is_posted', 'created_transaction'])

        return True

class SafeDeposit(models.Model):
    """نموذج إيداع في الخزنة"""

    number = models.CharField(_("رقم المستند"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='deposits',
                           verbose_name=_("الخزنة"), null=True, blank=True)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='deposits',
                           verbose_name=_("البنك"), null=True, blank=True)
    source = models.CharField(_("مصدر الإيداع"), max_length=255)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # معرف حركة الخزنة التي تم إنشاؤها بواسطة هذا الإيداع
    created_transaction = models.OneToOneField(SafeTransaction, on_delete=models.SET_NULL,
                                           null=True, blank=True, related_name='created_by_deposit',
                                           verbose_name=_("حركة الخزنة المنشأة"))

    class Meta:
        verbose_name = _("إيداع في الخزنة")
        verbose_name_plural = _("الإيداعات في الخزن")

    def __str__(self):
        name = self.safe.name if self.safe else (self.bank.name if self.bank else "N/A")
        return f"{self.number} - {name} - {self.amount}"

    def save(self, *args, **kwargs):
        # حفظ النموذج أولاً
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # إذا كان جديدًا وليس له معاملة مرتبطة، قم بعملية الترحيل تلقائيًا
        if is_new and not self.created_transaction:
            self.post_deposit()

    def post_deposit(self):
        """ترحيل الإيداع وإنشاء المعاملة المالية المرتبطة"""
        if self.is_posted and self.created_transaction:
            return False

        financial_obj = self.safe or self.bank
        if not financial_obj:
            return False

        # إنشاء حركة الخزنة أو البنك
        current_balance = financial_obj.current_balance
        # الإيداعات تزيد الرصيد
        balance_after = current_balance + self.amount

        safe_transaction = SafeTransaction(
            safe=self.safe,
            bank=self.bank,
            date=self.date,  # استخدام تاريخ الإيداع
            amount=self.amount,
            transaction_type=SafeTransaction.DEPOSIT,
            description=f"إيداع: {self.source}",
            reference_number=self.number,
            balance_before=current_balance,  # تعيين الرصيد قبل العملية
            balance_after=balance_after  # تعيين الرصيد بعد العملية
        )

        safe_transaction.save()
        self.created_transaction = safe_transaction

        # تحديث حالة الترحيل
        self.is_posted = True
        self.save(update_fields=['is_posted', 'created_transaction'])

        return True

    def unpost_deposit(self):
        """إلغاء ترحيل الإيداع وحذف المعاملة المالية المرتبطة"""
        if not self.is_posted:
            return False

        # حذف حركة الخزنة إذا وجدت
        if self.created_transaction:
            self.created_transaction.delete()
            self.created_transaction = None

        # تحديث حالة الترحيل
        self.is_posted = False
        self.save(update_fields=['is_posted', 'created_transaction'])

        return True

class SafeWithdrawal(models.Model):
    """نموذج سحب من الخزنة"""

    number = models.CharField(_("رقم المستند"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='withdrawals',
                           verbose_name=_("الخزنة"), null=True, blank=True)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='withdrawals',
                           verbose_name=_("البنك"), null=True, blank=True)
    destination = models.CharField(_("جهة السحب"), max_length=255)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # معرف حركة الخزنة التي تم إنشاؤها بواسطة هذا السحب
    created_transaction = models.OneToOneField(SafeTransaction, on_delete=models.SET_NULL,
                                          null=True, blank=True, related_name='created_by_withdrawal',
                                          verbose_name=_("حركة الخزنة المنشأة"))

    class Meta:
        verbose_name = _("سحب من الخزنة")
        verbose_name_plural = _("السحوبات من الخزن")

    def __str__(self):
        name = self.safe.name if self.safe else (self.bank.name if self.bank else "N/A")
        return f"{self.number} - {name} - {self.amount}"

    def save(self, *args, **kwargs):
        # حفظ النموذج أولاً
        is_new = self.pk is None
        super().save(*args, **kwargs)

        # إذا كان جديدًا وليس له معاملة مرتبطة، قم بعملية الترحيل تلقائيًا
        if is_new and not self.created_transaction:
            self.post_withdrawal()

    def post_withdrawal(self):
        """ترحيل السحب وإنشاء المعاملة المالية المرتبطة"""
        if self.is_posted and self.created_transaction:
            return False

        financial_obj = self.safe or self.bank
        if not financial_obj:
            return False

        # إنشاء حركة الخزنة أو البنك
        current_balance = financial_obj.current_balance
        # السحوبات تنقص الرصيد
        balance_after = current_balance - self.amount

        safe_transaction = SafeTransaction(
            safe=self.safe,
            bank=self.bank,
            date=self.date,  # استخدام تاريخ السحب
            amount=self.amount,
            transaction_type=SafeTransaction.WITHDRAWAL,
            description=f"سحب: {self.destination}",
            reference_number=self.number,
            balance_before=current_balance,  # تعيين الرصيد قبل العملية
            balance_after=balance_after  # تعيين الرصيد بعد العملية
        )

        safe_transaction.save()
        self.created_transaction = safe_transaction

        # تحديث حالة الترحيل
        self.is_posted = True
        self.save(update_fields=['is_posted', 'created_transaction'])

        return True

    def unpost_withdrawal(self):
        """إلغاء ترحيل السحب وحذف المعاملة المالية المرتبطة"""
        if not self.is_posted:
            return False

        # حذف حركة الخزنة إذا وجدت
        if self.created_transaction:
            self.created_transaction.delete()
            self.created_transaction = None

        # تحديث حالة الترحيل
        self.is_posted = False
        self.save(update_fields=['is_posted', 'created_transaction'])

        return True


class MoneyTransfer(models.Model):
    """نموذج تحويل الأموال بين الخزن والبنوك"""

    number = models.CharField(_("رقم المستند"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ المستند"), default=timezone.now)
    amount = models.DecimalField(_("المبلغ"), max_digits=15, decimal_places=2)
    
    # المصدر
    from_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_out',
                                 verbose_name=_("من خزنة"), null=True, blank=True)
    from_bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='transfers_out',
                                 verbose_name=_("من بنك"), null=True, blank=True)
    
    # الوجهة
    to_safe = models.ForeignKey(Safe, on_delete=models.CASCADE, related_name='transfers_in',
                               verbose_name=_("إلى خزنة"), null=True, blank=True)
    to_bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name='transfers_in',
                               verbose_name=_("إلى بنك"), null=True, blank=True)
    
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)

    # حركات الخزنة/البنك المرتبطة
    withdrawal_transaction = models.OneToOneField(SafeTransaction, on_delete=models.SET_NULL,
                                                null=True, blank=True, related_name='transfer_out',
                                                verbose_name=_("حركة السحب المنشأة"))
    deposit_transaction = models.OneToOneField(SafeTransaction, on_delete=models.SET_NULL,
                                             null=True, blank=True, related_name='transfer_in',
                                             verbose_name=_("حركة الإيداع المنشأة"))

    class Meta:
        verbose_name = _("تحويل أموال")
        verbose_name_plural = _("تحويلات الأموال")

    def __str__(self):
        source = self.from_safe.name if self.from_safe else self.from_bank.name
        dest = self.to_safe.name if self.to_safe else self.to_bank.name
        return f"{self.number} - من {source} إلى {dest} - {self.amount}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not self.number and is_new:
            # توليد رقم مستند تلقائي
            last_transfer = MoneyTransfer.objects.all().order_by('id').last()
            if last_transfer:
                self.number = f"TRF-{last_transfer.id + 1}"
            else:
                self.number = "TRF-1"
        
        super().save(*args, **kwargs)

        if is_new and self.is_posted and not self.withdrawal_transaction:
            self.post_transfer()

    def post_transfer(self):
        """ترحيل التحويل وإنشاء حركات الخزنة/البنك المرتبطة والقيود المحاسبية"""
        if not self.is_posted or (self.withdrawal_transaction and self.deposit_transaction):
            return False

        from django.db import transaction
        from accounting.models import JournalEntry, JournalItem

        source_obj = self.from_safe or self.from_bank
        dest_obj = self.to_safe or self.to_bank

        if not source_obj or not dest_obj:
            return False

        with transaction.atomic():
            # 1. إنشاء حركة السحب من المصدر
            withdrawal = SafeTransaction.objects.create(
                safe=self.from_safe,
                bank=self.from_bank,
                date=self.date,
                amount=self.amount,
                transaction_type=SafeTransaction.WITHDRAWAL,
                description=f"تحويل صادر إلى: {dest_obj.name} (مستند {self.number})",
                reference_number=self.number,
                balance_before=source_obj.current_balance,
                balance_after=source_obj.current_balance - self.amount
            )
            self.withdrawal_transaction = withdrawal

            # 2. إنشاء حركة الإيداع في الوجهة
            # نحتاج لتحديث رصيد الوجهة إذا كان هو نفسه المصدر (حالة نادرة لكن ممكنة في البرمجة)
            dest_current_balance = dest_obj.current_balance
            if source_obj == dest_obj:
                dest_current_balance = withdrawal.balance_after

            deposit = SafeTransaction.objects.create(
                safe=self.to_safe,
                bank=self.to_bank,
                date=self.date,
                amount=self.amount,
                transaction_type=SafeTransaction.DEPOSIT,
                description=f"تحويل وارد من: {source_obj.name} (مستند {self.number})",
                reference_number=self.number,
                balance_before=dest_current_balance,
                balance_after=dest_current_balance + self.amount
            )
            self.deposit_transaction = deposit

            # 3. إنشاء القيد المحاسبي
            if source_obj.account and dest_obj.account:
                journal_entry = JournalEntry.objects.create(
                    entry_number=f"TRF-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    date=self.date,
                    description=f"قيد تحويل أموال: من {source_obj.name} إلى {dest_obj.name}",
                    reference=self.number
                )

                # من حساب الوجهة (مدين)
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=dest_obj.account,
                    debit=self.amount,
                    memo=f"تحويل وارد من {source_obj.name}"
                )

                # إلى حساب المصدر (دائن)
                JournalItem.objects.create(
                    journal_entry=journal_entry,
                    account=source_obj.account,
                    credit=self.amount,
                    memo=f"تحويل صادر إلى {dest_obj.name}"
                )

                journal_entry.post()

            self.save(update_fields=['withdrawal_transaction', 'deposit_transaction'])
        
        return True

    def unpost_transfer(self):
        """إلغاء ترحيل التحويل وحذف الحركات والقيود"""
        if not self.is_posted:
            return False

        with transaction.atomic():
            if self.withdrawal_transaction:
                self.withdrawal_transaction.delete()
                self.withdrawal_transaction = None
            
            if self.deposit_transaction:
                self.deposit_transaction.delete()
                self.deposit_transaction = None
            
            self.is_posted = False
            self.save(update_fields=['is_posted', 'withdrawal_transaction', 'deposit_transaction'])
        
        return True


class StorePermit(models.Model):
    """نموذج أذونات المخزن (صرف واستلام)"""

    # أنواع الأذونات
    ISSUE = 'issue'
    RECEIVE = 'receive'

    PERMIT_TYPES = [
        (ISSUE, _("إذن صرف")),
        (RECEIVE, _("إذن استلام")),
    ]

    number = models.CharField(_("رقم الإذن"), max_length=50, unique=True)
    permit_type = models.CharField(_("نوع الإذن"), max_length=10, choices=PERMIT_TYPES)
    date = models.DateTimeField(_("تاريخ الإذن"), default=timezone.now)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='permits', verbose_name=_("المخزن"))
    person_name = models.CharField(_("اسم الشخص"), max_length=255, help_text=_("المستلم في حالة الصرف أو المرسل في حالة الاستلام"))
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name='permits', verbose_name=_("السائق"))
    representative = models.ForeignKey(Representative, on_delete=models.SET_NULL, null=True, blank=True, related_name='permits', verbose_name=_("المندوب"))
    reference_number = models.CharField(_("الرقم المرجعي"), max_length=50, blank=True, null=True)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=False)

    class Meta:
        verbose_name = _("إذن مخزني")
        verbose_name_plural = _("أذونات المخزن")
        ordering = ['-date']

    def __str__(self):
        return f"{self.get_permit_type_display()} - {self.number}"

    def post_permit(self):
        """ترحيل الإذن وإنشاء حركات المنتجات المرتبطة والقيود المحاسبية"""
        if self.is_posted:
            return False

        from django.db import transaction
        from accounting.models import JournalEntry, JournalItem
        from core.models import SystemSettings

        settings = SystemSettings.get_settings()

        with transaction.atomic():
            total_value = 0
            # إنشاء حركات المنتجات لكل بند في الإذن
            for item in self.items.all():
                # حساب الكمية بالوحدة الأساسية
                base_quantity = item.quantity * item.product_unit.conversion_factor
                
                # قيمة البند (استخدام سعر الشراء لتقييم المخزون)
                item_value = item.quantity * (item.product_unit.purchase_price or 0)
                total_value += item_value

                # تحديد نوع الحركة بناءً على نوع الإذن
                if self.permit_type == self.ISSUE:
                    transaction_type = ProductTransaction.SALE
                    description = f"صرف من المخزن: {self.number} - {self.person_name}"
                else:  # RECEIVE
                    transaction_type = ProductTransaction.PURCHASE
                    description = f"استلام في المخزن: {self.number} - {self.person_name}"

                # الحصول على الرصيد الحالي للمنتج
                current_balance = item.product.current_balance

                # حساب الرصيد بعد العملية
                if self.permit_type == self.ISSUE:
                    balance_after = current_balance - base_quantity
                else:  # RECEIVE
                    balance_after = current_balance + base_quantity

                # إنشاء حركة المنتج
                product_transaction = ProductTransaction.objects.create(
                    product=item.product,
                    date=self.date,
                    quantity=item.quantity,
                    product_unit=item.product_unit,
                    base_quantity=base_quantity,
                    transaction_type=transaction_type,
                    store=self.store,
                    description=description,
                    reference_number=self.number,
                    balance_before=current_balance,
                    balance_after=balance_after
                )

                # ربط حركة المنتج بالإذن
                item.created_transaction = product_transaction
                item.save(update_fields=['created_transaction'])

                # تحديث رصيد المنتج
                item.product.current_balance = balance_after
                item.product.save(update_fields=['current_balance'])

            # إنشاء القيد المحاسبي إذا توفرت الحسابات
            if self.store.account and total_value > 0:
                journal_entry = JournalEntry.objects.create(
                    entry_number=f"STR-{self.number}-{timezone.now().strftime('%Y%m%d%H%M%S')}",
                    date=self.date,
                    description=f"قيد مخزني تلقائي: {self.get_permit_type_display()} - {self.number}",
                    reference=self.number
                )
                
                if self.permit_type == self.RECEIVE:
                    # استلام: من حساب المخزون (مدين) إلى حساب المشتريات (دائن)
                    JournalItem.objects.create(
                        journal_entry=journal_entry,
                        account=self.store.account,
                        debit=total_value,
                        memo=f"استلام بضاعة - إذن رقم {self.number}"
                    )
                    
                    # استخدام حساب المشتريات من الإعدادات
                    purchases_acc = settings.purchases_account
                    if not purchases_acc:
                        from accounting.models import Account
                        purchases_acc = Account.objects.filter(code='3101').first()
                        
                    if purchases_acc:
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=purchases_acc,
                            credit=total_value,
                            memo=f"مقابل استلام بضاعة - إذن رقم {self.number}"
                        )
                else:
                    # صرف: من حساب تكلفة المبيعات (مدين) إلى حساب المخزون (دائن)
                    # محاولة الحصول على حساب التكلفة من أول صنف أو من الإعدادات
                    cogs_acc = settings.cogs_account
                    if not cogs_acc:
                        first_item = self.items.first()
                        if first_item and first_item.product.category:
                            cogs_acc = first_item.product.category.cogs_account
                    
                    if not cogs_acc:
                        from accounting.models import Account
                        cogs_acc = Account.objects.filter(code='4101').first()

                    if cogs_acc:
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=cogs_acc,
                            debit=total_value,
                            memo=f"تكلفة بضاعة منصرفة - إذن رقم {self.number}"
                        )
                        JournalItem.objects.create(
                            journal_entry=journal_entry,
                            account=self.store.account,
                            credit=total_value,
                            memo=f"صرف بضاعة - إذن رقم {self.number}"
                        )
                
                # ترحيل القيد إذا كان متوازناً ولدينا طرفين
                if journal_entry.items.count() >= 2:
                    journal_entry.post()

            # تحديث حالة الترحيل
            self.is_posted = True
            self.save(update_fields=['is_posted'])

            return True

    def unpost_permit(self):
        """إلغاء ترحيل الإذن وحذف حركات المنتجات المرتبطة"""
        if not self.is_posted:
            return False

        from django.db import transaction

        with transaction.atomic():
            # حذف حركات المنتجات لكل بند في الإذن
            for item in self.items.all():
                if item.created_transaction:
                    # حفظ المنتج قبل حذف الحركة
                    product = item.created_transaction.product

                    # حذف حركة المنتج
                    item.created_transaction.delete()
                    item.created_transaction = None
                    item.save(update_fields=['created_transaction'])

                    # إعادة حساب أرصدة المنتج
                    ProductTransaction.recalculate_balances(product)

            # تحديث حالة الترحيل
            self.is_posted = False
            self.save(update_fields=['is_posted'])

            return True


class StorePermitItem(models.Model):
    """نموذج بنود أذونات المخزن"""

    permit = models.ForeignKey(StorePermit, on_delete=models.CASCADE, related_name='items', verbose_name=_("الإذن"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='permit_items', verbose_name=_("المنتج"))
    product_unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE, related_name='permit_items', verbose_name=_("وحدة المنتج"))
    quantity = models.DecimalField(_("الكمية"), max_digits=15, decimal_places=3)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)

    # معرف حركة المنتج التي تم إنشاؤها بواسطة هذا البند
    created_transaction = models.OneToOneField(ProductTransaction, on_delete=models.SET_NULL,
                                          null=True, blank=True, related_name='created_by_permit_item',
                                          verbose_name=_("حركة المنتج المنشأة"))

    class Meta:
        verbose_name = _("بند إذن مخزني")
        verbose_name_plural = _("بنود أذونات المخزن")

    def __str__(self):
        return f"{self.product.name} - {self.formatted_quantity} {self.product_unit.unit.name}"

    @property
    def formatted_quantity(self):
        """تنسيق الكمية كرقم صحيح إذا كانت بدون كسور"""
        if self.quantity == int(self.quantity):
            return int(self.quantity)
        return self.quantity

    def save(self, *args, **kwargs):
        """تقريب الكمية إلى رقم صحيح إذا كانت بدون كسور عند الحفظ"""
        # إذا كانت الكمية تساوي قيمتها المقربة إلى أقرب عدد صحيح
        if self.quantity == round(self.quantity):
            # تحويل الكمية إلى عدد صحيح إذا كانت بدون كسور
            if self.quantity == int(self.quantity):
                # لا نغير القيمة الفعلية في قاعدة البيانات، فقط طريقة العرض
                pass

        super().save(*args, **kwargs)


class InventoryAdjustment(models.Model):
    """نموذج تسويات المخزون (زيادة/نقصان يدوية)"""
    number = models.CharField(_("رقم التسوية"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ التسوية"), default=timezone.now)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='adjustments', verbose_name=_("المخزن"))
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='adjustments', verbose_name=_("المنتج"))
    quantity = models.DecimalField(_("الكمية"), max_digits=15, decimal_places=3)
    product_unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE, verbose_name=_("الوحدة"))
    
    INCREASE = 'increase'
    DECREASE = 'decrease'
    ADJUSTMENT_TYPES = [
        (INCREASE, _("زيادة")),
        (DECREASE, _("نقصان")),
    ]
    adjustment_type = models.CharField(_("نوع التسوية"), max_length=10, choices=ADJUSTMENT_TYPES)
    reason = models.TextField(_("سبب التسوية"), blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)
    created_transaction = models.OneToOneField(ProductTransaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='adjustment_record')

    class Meta:
        verbose_name = _("تسوية مخزون")
        verbose_name_plural = _("تسويات المخزون")

    def __str__(self):
        return f"{self.number} - {self.product.name} ({self.get_adjustment_type_display()})"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not self.number and is_new:
            last = InventoryAdjustment.objects.all().order_by('id').last()
            self.number = f"ADJ-{last.id + 1}" if last else "ADJ-1"
        
        super().save(*args, **kwargs)
        
        if is_new and self.is_posted and not self.created_transaction:
            self.post_adjustment()

    def post_adjustment(self):
        from django.db import transaction
        with transaction.atomic():
            # حساب الكمية الأساسية
            base_qty = self.quantity * self.product_unit.conversion_factor
            
            # في حالة النقصان، نجعل الكمية الأساسية سالبة في الحركة
            if self.adjustment_type == self.DECREASE:
                base_qty = -abs(base_qty)
            else:
                base_qty = abs(base_qty)
            
            trans = ProductTransaction.objects.create(
                product=self.product,
                date=self.date,
                quantity=self.quantity,
                product_unit=self.product_unit,
                base_quantity=base_qty,
                transaction_type=ProductTransaction.ADJUSTMENT,
                store=self.store,
                description=f"تسوية مخزون ({self.get_adjustment_type_display()}): {self.reason or ''}",
                reference_number=self.number,
                balance_before=0,
                balance_after=0
            )
            self.created_transaction = trans
            self.save(update_fields=['created_transaction'])
            ProductTransaction.recalculate_balances(self.product)


class StockTransfer(models.Model):
    """نموذج تحويل المخزون بين المخازن"""
    number = models.CharField(_("رقم التحويل"), max_length=50, blank=True)
    date = models.DateTimeField(_("تاريخ التحويل"), default=timezone.now)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_transfers', verbose_name=_("المنتج"))
    quantity = models.DecimalField(_("الكمية"), max_digits=15, decimal_places=3)
    product_unit = models.ForeignKey(ProductUnit, on_delete=models.CASCADE, verbose_name=_("الوحدة"))
    
    from_store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='transfers_out', verbose_name=_("من مخزن"))
    to_store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='transfers_in', verbose_name=_("إلى مخزن"))
    
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    is_posted = models.BooleanField(_("مرحل"), default=True)
    
    withdrawal_transaction = models.OneToOneField(ProductTransaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_transfer_out')
    deposit_transaction = models.OneToOneField(ProductTransaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='stock_transfer_in')

    class Meta:
        verbose_name = _("تحويل مخزني")
        verbose_name_plural = _("تحويلات مخزنية")

    def __str__(self):
        return f"{self.number} - {self.product.name} من {self.from_store.name} إلى {self.to_store.name}"

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        if not self.number and is_new:
            last = StockTransfer.objects.all().order_by('id').last()
            self.number = f"TRF-ST-{last.id + 1}" if last else "TRF-ST-1"
        
        super().save(*args, **kwargs)
        
        if is_new and self.is_posted and not (self.withdrawal_transaction and self.deposit_transaction):
            self.post_transfer()

    def post_transfer(self):
        from django.db import transaction
        with transaction.atomic():
            base_qty = self.quantity * self.product_unit.conversion_factor
            
            # 1. حركة الصرف من المخزن المصدر (نستخدم SALE للصرف)
            withdrawal = ProductTransaction.objects.create(
                product=self.product,
                date=self.date,
                quantity=self.quantity,
                product_unit=self.product_unit,
                base_quantity=base_qty,
                transaction_type=ProductTransaction.SALE,
                store=self.from_store,
                description=f"تحويل صادر إلى {self.to_store.name} (مستند {self.number})",
                reference_number=self.number,
                balance_before=0,
                balance_after=0
            )
            
            # 2. حركة الإيداع في المخزن الوجهة (نستخدم PURCHASE للإيداع)
            deposit = ProductTransaction.objects.create(
                product=self.product,
                date=self.date,
                quantity=self.quantity,
                product_unit=self.product_unit,
                base_quantity=base_qty,
                transaction_type=ProductTransaction.PURCHASE,
                store=self.to_store,
                description=f"تحويل وارد من {self.from_store.name} (مستند {self.number})",
                reference_number=self.number,
                balance_before=0,
                balance_after=0
            )
            
            self.withdrawal_transaction = withdrawal
            self.deposit_transaction = deposit
            self.save(update_fields=['withdrawal_transaction', 'deposit_transaction'])
            ProductTransaction.recalculate_balances(self.product)
