from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings

class Company(models.Model):
    name = models.CharField(_("اسم الشركة"), max_length=255)
    address = models.TextField(_("العنوان"), blank=True, null=True)
    phone = models.CharField(_("رقم الهاتف"), max_length=20, blank=True, null=True)
    email = models.EmailField(_("البريد الإلكتروني"), blank=True, null=True)
    tax_number = models.CharField(_("الرقم الضريبي"), max_length=50, blank=True, null=True)
    logo = models.ImageField(_("الشعار"), upload_to='company_logos/', blank=True, null=True)

    class Meta:
        verbose_name = _("شركة")
        verbose_name_plural = _("الشركات")

    def __str__(self):
        return self.name

class Branch(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='branches', verbose_name=_("الشركة"))
    name = models.CharField(_("اسم الفرع"), max_length=255)
    address = models.TextField(_("العنوان"), blank=True, null=True)
    phone = models.CharField(_("رقم الهاتف"), max_length=20, blank=True, null=True)
    manager = models.CharField(_("المدير"), max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = _("فرع")
        verbose_name_plural = _("الفروع")

    def __str__(self):
        return f"{self.name} - {self.company.name}"

class Store(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stores', verbose_name=_("الفرع"))
    name = models.CharField(_("اسم المخزن"), max_length=255)
    account = models.OneToOneField('accounting.Account', on_delete=models.PROTECT, null=True, blank=True,
                                 related_name='store', verbose_name=_("حساب المخزون"))
    address = models.TextField(_("العنوان"), blank=True, null=True)
    keeper = models.CharField(_("أمين المخزن"), max_length=255, blank=True, null=True)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)

    class Meta:
        verbose_name = _("مخزن")
        verbose_name_plural = _("المخازن")

    def __str__(self):
        return f"{self.name} - {self.branch.name}"

class Safe(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='safes', verbose_name=_("الفرع"))
    name = models.CharField(_("اسم الخزنة"), max_length=255)
    initial_balance = models.DecimalField(_("الرصيد الافتتاحي"), max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(_("الرصيد الحالي"), max_digits=15, decimal_places=2, default=0)
    # ربط الخزنة بحساب في شجرة الحسابات
    account = models.OneToOneField('accounting.Account', on_delete=models.PROTECT, null=True, blank=True, related_name='safe', verbose_name=_("حساب الأستاذ"))

    class Meta:
        verbose_name = _("خزنة")
        verbose_name_plural = _("الخزن")

    def __str__(self):
        return f"{self.name} - {self.branch.name}"

class Bank(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='banks', verbose_name=_("الفرع"))
    name = models.CharField(_("اسم البنك"), max_length=255)
    account_number = models.CharField(_("رقم الحساب"), max_length=50, blank=True, null=True)
    iban = models.CharField(_("IBAN"), max_length=50, blank=True, null=True)
    address = models.TextField(_("العنوان"), blank=True, null=True)
    initial_balance = models.DecimalField(_("الرصيد الافتتاحي"), max_digits=15, decimal_places=2, default=0)
    current_balance = models.DecimalField(_("الرصيد الحالي"), max_digits=15, decimal_places=2, default=0)
    # ربط البنك بحساب في شجرة الحسابات
    account = models.OneToOneField('accounting.Account', on_delete=models.PROTECT, null=True, blank=True, related_name='bank', verbose_name=_("حساب الأستاذ"))

    class Meta:
        verbose_name = _("بنك")
        verbose_name_plural = _("البنوك")

    def __str__(self):
        return f"{self.name} - {self.branch.name}"

class Representative(models.Model):
    name = models.CharField(_("الاسم"), max_length=255)
    phone = models.CharField(_("رقم الهاتف"), max_length=20, blank=True, null=True)
    address = models.TextField(_("العنوان"), blank=True, null=True)
    id_number = models.CharField(_("رقم الهوية"), max_length=20, blank=True, null=True)
    commission_percentage = models.DecimalField(_("نسبة العمولة"), max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)

    class Meta:
        verbose_name = _("مندوب")
        verbose_name_plural = _("المناديب")

    def __str__(self):
        return self.name

class Driver(models.Model):
    name = models.CharField(_("الاسم"), max_length=255)
    phone = models.CharField(_("رقم الهاتف"), max_length=20, blank=True, null=True)
    address = models.TextField(_("العنوان"), blank=True, null=True)
    id_number = models.CharField(_("رقم الهوية"), max_length=20, blank=True, null=True)
    license_number = models.CharField(_("رقم الرخصة"), max_length=20, blank=True, null=True)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)

    class Meta:
        verbose_name = _("سائق")
        verbose_name_plural = _("السائقين")

    def __str__(self):
        return self.name

class Contact(models.Model):
    CUSTOMER = 'customer'
    SUPPLIER = 'supplier'

    CONTACT_TYPE_CHOICES = [
        (CUSTOMER, _("عميل")),
        (SUPPLIER, _("مورد")),
    ]

    name = models.CharField(_("الاسم"), max_length=255)
    contact_type = models.CharField(_("نوع جهة الاتصال"), max_length=20, choices=CONTACT_TYPE_CHOICES)
    phone = models.CharField(_("رقم الهاتف"), max_length=20, blank=True, null=True)
    alternative_phone = models.CharField(_("رقم هاتف بديل"), max_length=20, blank=True, null=True)
    address = models.TextField(_("العنوان"), blank=True, null=True)
    email = models.EmailField(_("البريد الإلكتروني"), blank=True, null=True)
    tax_number = models.CharField(_("الرقم الضريبي"), max_length=50, blank=True, null=True)
    
    DEBIT = 'debit'
    CREDIT = 'credit'
    BALANCE_TYPE_CHOICES = [
        (DEBIT, _("مدين")),
        (CREDIT, _("دائن")),
    ]

    RETAIL = 'retail'
    WHOLESALE = 'wholesale'
    DISTRIBUTOR = 'distributor'
    SUPPLIER_PRICE = 'supplier'
    PRICING_SYSTEM_CHOICES = [
        (RETAIL, _("مستهلك")),
        (WHOLESALE, _("جملة")),
        (DISTRIBUTOR, _("مورد")),
        (SUPPLIER_PRICE, _("سعر المورد")),
    ]

    initial_balance = models.DecimalField(_("الرصيد الافتتاحي"), max_digits=15, decimal_places=2, default=0)
    initial_balance_date = models.DateField(_("تاريخ الرصيد الافتتاحي"), blank=True, null=True)
    initial_balance_type = models.CharField(_("نوع الرصيد الافتتاحي"), max_length=10, choices=BALANCE_TYPE_CHOICES, default=DEBIT)
    pricing_system = models.CharField(_("نظام التسعير"), max_length=20, choices=PRICING_SYSTEM_CHOICES, default=RETAIL)
    current_balance = models.DecimalField(_("الرصيد الحالي"), max_digits=15, decimal_places=2, default=0)
    credit_limit = models.DecimalField(_("حد الائتمان"), max_digits=15, decimal_places=2, default=0)
    notes = models.TextField(_("ملاحظات"), blank=True, null=True)
    # ربط جهة الاتصال بحساب في شجرة الحسابات
    account = models.OneToOneField('accounting.Account', on_delete=models.PROTECT, null=True, blank=True, related_name='contact', verbose_name=_("حساب الأستاذ"))

    class Meta:
        verbose_name = _("جهة اتصال")
        verbose_name_plural = _("جهات الاتصال")

    def __str__(self):
        return f"{self.name} - {self.get_contact_type_display()}"



class SystemSettings(models.Model):
    """نموذج إعدادات النظام"""

    # إعدادات الفواتير
    DEFAULT_INVOICE_TYPE_CHOICES = [
        ('cash', _('نقدي')),
        ('credit', _('آجل')),
    ]

    default_invoice_type = models.CharField(_("النوع الافتراضي للفاتورة"), max_length=10,
                                          choices=DEFAULT_INVOICE_TYPE_CHOICES, default='cash')
    update_purchase_price = models.BooleanField(_("تحديث سعر الشراء من آخر فاتورة"), default=True)
    update_sale_price = models.BooleanField(_("تحديث سعر البيع من آخر فاتورة"), default=False)
    alert_below_sale_price = models.BooleanField(_("التنبيه عند البيع بسعر أقل من سعر البيع"), default=True)
    alert_below_purchase_price = models.BooleanField(_("التنبيه عند البيع بسعر أقل من سعر الشراء"), default=True)

    # خيارات التعامل مع تكرار الصنف في الفاتورة
    DUPLICATE_ITEM_CHOICES = [
        ('allow_duplicate', _('السماح بتكرار الصنف في بنود الفاتورة')),
        ('increase_quantity', _('زيادة الكمية تلقائياً عند تكرار الصنف')),
    ]

    duplicate_item_handling = models.CharField(_("التعامل مع تكرار الصنف"), max_length=20,
                                             choices=DUPLICATE_ITEM_CHOICES, default='increase_quantity')

    # الحقول القديمة (سيتم إزالتها بعد الترحيل)
    allow_duplicate_items = models.BooleanField(_("السماح بتكرار الصنف في بنود الفاتورة"), default=False)
    auto_increase_quantity = models.BooleanField(_("زيادة الكمية تلقائياً عند تكرار الصنف"), default=True)
    default_customer = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='default_customer_settings',
                                       verbose_name=_("العميل الافتراضي لفواتير البيع"),
                                       limit_choices_to={'contact_type': 'customer'})
    default_supplier = models.ForeignKey(Contact, on_delete=models.SET_NULL, null=True, blank=True,
                                       related_name='default_supplier_settings',
                                       verbose_name=_("المورد الافتراضي لفواتير الشراء"),
                                       limit_choices_to={'contact_type': 'supplier'})
    default_safe = models.ForeignKey(Safe, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='default_safe_settings',
                                   verbose_name=_("الخزنة الافتراضية"))
    default_store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='default_store_settings',
                                    verbose_name=_("المخزن الافتراضي"))

    # إعدادات المحاسبة
    sales_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name='settings_sales', verbose_name=_("حساب المبيعات الافتراضي"))
    purchases_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                        related_name='settings_purchases', verbose_name=_("حساب المشتريات الافتراضي"))
    vat_output_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                          related_name='settings_vat_out', verbose_name=_("حساب ضريبة المخرجات (المبيعات)"))
    vat_input_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                         related_name='settings_vat_in', verbose_name=_("حساب ضريبة المدخلات (المشتريات)"))
    cogs_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='settings_cogs', verbose_name=_("حساب تكلفة البضاعة المباعة"))
    default_expense_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                              related_name='settings_expense', verbose_name=_("حساب المصروفات الافتراضي"))
    default_income_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                             related_name='settings_income', verbose_name=_("حساب الإيرادات الافتراضي"))
    default_salaries_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                               related_name='settings_salaries', verbose_name=_("حساب الرواتب والأجور"))
    default_loans_account = models.ForeignKey('accounting.Account', on_delete=models.SET_NULL, null=True, blank=True,
                                            related_name='settings_loans', verbose_name=_("حساب سلف الموظفين"))
    vat_percentage = models.DecimalField(_("نسبة ضريبة القيمة المضافة (%)"), max_digits=5, decimal_places=2, default=5.0)

    # إعدادات الأصول الثابتة
    DEPRECIATION_METHOD_CHOICES = [
        ('straight_line', _('القسط الثابت')),
        ('reducing_balance', _('القسط المتناقص')),
    ]
    default_depreciation_method = models.CharField(_("طريقة الإهلاك الافتراضية"), max_length=20,
                                                 choices=DEPRECIATION_METHOD_CHOICES, default='straight_line')
    
    # إعدادات الفترة المالية
    fiscal_year_start = models.DateField(_("بداية السنة المالية"), null=True, blank=True)
    lock_date = models.DateField(_("تاريخ إغلاق العمليات"), null=True, blank=True, 
                               help_text=_("لا يمكن إضافة أو تعديل قيود قبل هذا التاريخ"))
    
    # إعدادات القيود والموافقة
    require_journal_approval = models.BooleanField(_("طلب الموافقة على القيود اليدوية"), default=False)

    # إعدادات طباعة الفاتورة
    hide_company_info = models.BooleanField(_("إخفاء بيانات الشركة في الفاتورة"), default=False)
    show_previous_balance = models.BooleanField(_("إظهار الحساب السابق للعميل"), default=True)
    invoice_header_text = models.TextField(_("نص رأس الفاتورة"), blank=True, null=True)
    invoice_footer_text = models.TextField(_("نص ذيل الفاتورة"), blank=True, null=True)

    # إعدادات طباعة تقرير الأذونات المخزنية
    show_driver_in_permit_report = models.BooleanField(_("إظهار حقل السائق في تقرير الأذونات"), default=True)
    show_representative_in_permit_report = models.BooleanField(_("إظهار حقل المندوب في تقرير الأذونات"), default=True)

    # إعدادات الفروع
    main_branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='is_main_for', verbose_name=_("الفرع الرئيسي"))
    share_customers = models.BooleanField(_("مشاركة العملاء بين الفروع"), default=False)
    share_products = models.BooleanField(_("مشاركة المنتجات بين الفروع"), default=False)
    share_suppliers = models.BooleanField(_("مشاركة الموردين بين الفروع"), default=False)
    link_cost_centers = models.BooleanField(_("ربط مراكز التكلفة بين الفروع"), default=True)
    per_branch_accounts = models.BooleanField(_("تخصيص الحسابات على مستوى الفروع"), default=False)

    # إعدادات النظام الإضافية
    system_language = models.CharField(_("لغة النظام"), max_length=10, default='ar')
    enable_notifications = models.BooleanField(_("تفعيل التنبيهات"), default=True)

    class Meta:
        verbose_name = _("إعدادات النظام")
        verbose_name_plural = _("إعدادات النظام")

    def __str__(self):
        return _("إعدادات النظام")

    @classmethod
    def get_settings(cls):
        """الحصول على إعدادات النظام، أو إنشاء إعدادات افتراضية إذا لم تكن موجودة"""
        settings, created = cls.objects.get_or_create(pk=1)
        return settings
