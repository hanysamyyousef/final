from django.db import models
from django.utils.translation import gettext_lazy as _
from mptt.models import MPTTModel, TreeForeignKey
from django.utils import timezone
from decimal import Decimal

class AuditLog(models.Model):
    """سجل التدقيق (Audit Trail) لمراقبة التغييرات الحساسة"""
    ACTION_CHOICES = (
        ('CREATE', _('إنشاء')),
        ('UPDATE', _('تعديل')),
        ('DELETE', _('حذف')),
        ('POST', _('ترحيل')),
        ('UNPOST', _('إلغاء ترحيل')),
    )
    
    user = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, verbose_name=_("المستخدم"))
    action = models.CharField(_("الإجراء"), max_length=10, choices=ACTION_CHOICES)
    model_name = models.CharField(_("اسم النموذج"), max_length=50)
    object_id = models.PositiveIntegerField(_("رقم الكائن"))
    object_repr = models.CharField(_("وصف الكائن"), max_length=200)
    changes = models.JSONField(_("التغييرات"), null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name=_("الوقت"))
    ip_address = models.GenericIPAddressField(_("عنوان IP"), null=True, blank=True)

    class Meta:
        verbose_name = _("سجل تدقيق")
        verbose_name_plural = _("سجل التدقيق")
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} - {self.model_name} ({self.object_repr})"

class Account(MPTTModel):
    """شجرة الحسابات (Chart of Accounts)"""
    ACCOUNT_TYPE_CHOICES = [
        ('asset', _('أصول')),
        ('liability', _('خصوم')),
        ('equity', _('حقوق ملكية')),
        ('income', _('إيرادات')),
        ('expense', _('مصروفات')),
    ]

    name = models.CharField(_("اسم الحساب"), max_length=100)
    code = models.CharField(_("كود الحساب"), max_length=20, unique=True)
    account_type = models.CharField(_("نوع الحساب"), max_length=20, choices=ACCOUNT_TYPE_CHOICES)
    parent = TreeForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                            related_name='children', verbose_name=_("الحساب الأب"))
    
    is_selectable = models.BooleanField(_("قابل للتحديد في القيود"), default=True,
                                       help_text=_("إذا كان خطأ، فهذا حساب أب للتجميع فقط"))
    
    balance = models.DecimalField(_("الرصيد الحالي"), max_digits=15, decimal_places=2, default=0)

    class MPTTMeta:
        order_insertion_by = ['code']

    class Meta:
        verbose_name = _("حساب")
        verbose_name_plural = _("شجرة الحسابات")

    def __str__(self):
        return f"{self.code} - {self.name}"

class CostCenter(models.Model):
    """مراكز التكلفة (Cost Centers)"""
    name = models.CharField(_("اسم مركز التكلفة"), max_length=100)
    code = models.CharField(_("كود المركز"), max_length=20, unique=True)
    description = models.TextField(_("وصف"), blank=True)

    class Meta:
        verbose_name = _("مركز تكلفة")
        verbose_name_plural = _("مراكز التكلفة")

    def __str__(self):
        return f"{self.code} - {self.name}"

class FinancialPeriod(models.Model):
    """الفترات المالية (Financial Periods)"""
    name = models.CharField(_("اسم الفترة"), max_length=50) # مثال: يناير 2026
    start_date = models.DateField(_("تاريخ البدء"))
    end_date = models.DateField(_("تاريخ الانتهاء"))
    is_closed = models.BooleanField(_("مغلقة"), default=False)

    class Meta:
        verbose_name = _("فترة مالية")
        verbose_name_plural = _("الفترات المالية")
        ordering = ['-start_date']

    def __str__(self):
        return self.name

    @classmethod
    def is_date_locked(cls, date):
        """التحقق مما إذا كان التاريخ يقع ضمن فترة مغلقة"""
        if hasattr(date, 'date'):
            date = date.date()
        return cls.objects.filter(start_date__lte=date, end_date__gte=date, is_closed=True).exists()

class JournalEntry(models.Model):
    """رأس القيد المحاسبي (Journal Entry Header)"""
    entry_number = models.CharField(_("رقم القيد"), max_length=50, unique=True)
    date = models.DateTimeField(_("تاريخ القيد"), default=timezone.now)
    description = models.TextField(_("الوصف/البيان"), blank=True)
    reference = models.CharField(_("المرجع"), max_length=100, blank=True, 
                                help_text=_("رقم الفاتورة أو رقم السند المرتبط"))
    
    is_posted = models.BooleanField(_("تم الترحيل"), default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("قيد محاسبي")
        verbose_name_plural = _("القيود المحاسبية")
        ordering = ['-date', '-entry_number']

    def __str__(self):
        return f"{self.entry_number} ({self.date.date()})"

    def clean(self):
        """التحقق من صحة البيانات قبل الحفظ"""
        from django.core.exceptions import ValidationError
        if FinancialPeriod.is_date_locked(self.date):
            raise ValidationError(_("لا يمكن إضافة أو تعديل قيود في فترة مالية مغلقة."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if FinancialPeriod.is_date_locked(self.date):
            from django.core.exceptions import ValidationError
            raise ValidationError(_("لا يمكن حذف قيود في فترة مالية مغلقة."))
        super().delete(*args, **kwargs)

    def post(self):
        """ترحيل القيد وتحديث أرصدة الحسابات"""
        if self.is_posted:
            return False
        
        # التحقق من قفل الفترة المالية
        if FinancialPeriod.is_date_locked(self.date):
            raise ValueError(_("لا يمكن الترحيل في هذه الفترة لأنها مغلقة مالياً."))
        
        # التأكد من توازن القيد
        items = self.items.all()
        if not items.exists():
            raise ValueError(_("لا يمكن ترحيل قيد فارغ."))

        total_debit = sum(item.debit for item in items)
        total_credit = sum(item.credit for item in items)
        
        if total_debit != total_credit:
            raise ValueError(_("القيد غير متوازن: مجموع المدين (%(debit)s) لا يساوي مجموع الدائن (%(credit)s)") % {
                'debit': total_debit, 'credit': total_credit
            })

        from django.db import transaction
        with transaction.atomic():
            for item in items:
                account = item.account
                # تحديث الرصيد بناءً على نوع الحساب
                if account.account_type in ['asset', 'expense']:
                    account.balance += (item.debit - item.credit)
                else:
                    account.balance += (item.credit - item.debit)
                account.save()

                # تحديث أرصدة الموديلات المرتبطة
                if hasattr(account, 'safe'):
                    safe = account.safe
                    safe.current_balance = account.balance
                    safe.save(update_fields=['current_balance'])
                elif hasattr(account, 'contact'):
                    contact = account.contact
                    contact.current_balance = account.balance
                    contact.save(update_fields=['current_balance'])
            
            self.is_posted = True
            self.save()

            # تسجيل في سجل التدقيق
            AuditLog.objects.create(
                action='POST',
                model_name='JournalEntry',
                object_id=self.id,
                object_repr=str(self),
                changes={'status': 'posted', 'debit_total': str(total_debit)}
            )
        
        return True

    def unpost(self):
        """إلغاء ترحيل القيد وعكس تأثيره على أرصدة الحسابات"""
        if not self.is_posted:
            return False
            
        # التحقق من قفل الفترة المالية
        if FinancialPeriod.is_date_locked(self.date):
            raise ValueError(_("لا يمكن إلغاء الترحيل في هذه الفترة لأنها مغلقة مالياً."))
            
        from django.db import transaction
        with transaction.atomic():
            items = self.items.all()
            for item in items:
                account = item.account
                # عكس التحديث بناءً على نوع الحساب
                if account.account_type in ['asset', 'expense']:
                    account.balance -= (item.debit - item.credit)
                else:
                    account.balance -= (item.credit - item.debit)
                account.save()

                # تحديث أرصدة الموديلات المرتبطة
                if hasattr(account, 'safe'):
                    safe = account.safe
                    safe.current_balance = account.balance
                    safe.save(update_fields=['current_balance'])
                elif hasattr(account, 'contact'):
                    contact = account.contact
                    contact.current_balance = account.balance
                    contact.save(update_fields=['current_balance'])
            
            self.is_posted = False
            self.save()

            # تسجيل في سجل التدقيق
            AuditLog.objects.create(
                action='UNPOST',
                model_name='JournalEntry',
                object_id=self.id,
                object_repr=str(self),
                changes={'status': 'unposted'}
            )
            
        return True

class JournalItem(models.Model):
    """سطور القيد المحاسبي (Journal Entry Lines)"""
    journal_entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, 
                                     related_name='items', verbose_name=_("القيد"))
    account = models.ForeignKey(Account, on_delete=models.CASCADE, 
                               related_name='journal_items', verbose_name=_("الحساب"))
    cost_center = models.ForeignKey(CostCenter, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='journal_items', verbose_name=_("مركز التكلفة"))
    debit = models.DecimalField(_("مدين"), max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(_("دائن"), max_digits=15, decimal_places=2, default=0)
    vat_rate = models.DecimalField(_("نسبة الضريبة (%)"), max_digits=5, decimal_places=2, default=0)
    vat_amount = models.DecimalField(_("مبلغ الضريبة"), max_digits=15, decimal_places=2, default=0)
    memo = models.CharField(_("بيان"), max_length=255, blank=True)

    class Meta:
        verbose_name = _("سطر قيد")
        verbose_name_plural = _("سطور القيود")

    def __str__(self):
        return f"{self.account.name} | D: {self.debit} | C: {self.credit}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.journal_entry.is_posted:
            raise ValidationError(_("لا يمكن تعديل بنود قيد مرحل. قم بإلغاء الترحيل أولاً."))
        if FinancialPeriod.is_date_locked(self.journal_entry.date):
            raise ValidationError(_("لا يمكن تعديل بنود في فترة مالية مغلقة."))

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        from django.core.exceptions import ValidationError
        if self.journal_entry.is_posted:
            raise ValidationError(_("لا يمكن حذف بنود قيد مرحل. قم بإلغاء الترحيل أولاً."))
        if FinancialPeriod.is_date_locked(self.journal_entry.date):
            raise ValidationError(_("لا يمكن حذف بنود في فترة مالية مغلقة."))
        super().delete(*args, **kwargs)

class FixedAsset(models.Model):
    """إدارة الأصول الثابتة (Fixed Assets)"""
    DEPRECIATION_METHODS = (
        ('SL', _('القسط الثابت - Straight Line')),
        ('DB', _('الرصيد المتناقص - Declining Balance')),
    )

    name = models.CharField(_("اسم الأصل"), max_length=100)
    code = models.CharField(_("كود الأصل"), max_length=20, unique=True)
    asset_account = models.ForeignKey(Account, on_delete=models.PROTECT, 
                                     related_name='fixed_assets', verbose_name=_("حساب الأصل"))
    depreciation_account = models.ForeignKey(Account, on_delete=models.PROTECT,
                                           related_name='depreciated_assets', verbose_name=_("حساب مجمع الإهلاك"))
    expense_account = models.ForeignKey(Account, on_delete=models.PROTECT,
                                       related_name='depreciation_expenses', verbose_name=_("حساب مصروف الإهلاك"))
    
    acquisition_date = models.DateField(_("تاريخ الاستحواذ"))
    acquisition_cost = models.DecimalField(_("تكلفة الاستحواذ"), max_digits=15, decimal_places=2)
    salvage_value = models.DecimalField(_("قيمة الخردة"), max_digits=15, decimal_places=2, default=0)
    useful_life_years = models.PositiveIntegerField(_("العمر الإنتاجي (سنوات)"))
    
    depreciation_method = models.CharField(_("طريقة الإهلاك"), max_length=2, 
                                          choices=DEPRECIATION_METHODS, default='SL')
    
    current_value = models.DecimalField(_("القيمة الدفترية الحالية"), max_digits=15, decimal_places=2)
    last_depreciation_date = models.DateField(_("تاريخ آخر إهلاك"), null=True, blank=True)
    is_active = models.BooleanField(_("نشط"), default=True)

    class Meta:
        verbose_name = _("أصل ثابت")
        verbose_name_plural = _("الأصول الثابتة")

    def __str__(self):
        return f"{self.code} - {self.name}"

    def calculate_depreciation(self, target_date=None):
        """حساب مبلغ الإهلاك للفترة"""
        if not target_date:
            target_date = timezone.now().date()
        
        if self.last_depreciation_date and self.last_depreciation_date >= target_date:
            return 0
            
        start_date = self.last_depreciation_date or self.acquisition_date
        days = (target_date - start_date).days
        
        if days <= 0:
            return 0

        # القسط الثابت
        annual_depreciation = (self.acquisition_cost - self.salvage_value) / self.useful_life_years
        daily_depreciation = annual_depreciation / 365
        
        amount = daily_depreciation * Decimal(str(days))
        
        # التأكد من عدم تجاوز القيمة الدفترية لقيمة الخردة
        if self.current_value - amount < self.salvage_value:
            amount = self.current_value - self.salvage_value
            
        return round(amount, 2)

    def post_depreciation(self, target_date=None):
        """إنشاء وترحيل قيد الإهلاك"""
        if not target_date:
            target_date = timezone.now().date()
            
        amount = self.calculate_depreciation(target_date)
        if amount <= 0:
            return None
            
        from django.db import transaction
        with transaction.atomic():
            # إنشاء القيد
            entry = JournalEntry.objects.create(
                entry_number=f"DEP-{self.code}-{target_date.strftime('%Y%m%d')}",
                date=timezone.make_aware(timezone.datetime.combine(target_date, timezone.datetime.min.time())),
                description=f"إهلاك أصل: {self.name} للفترة المنتهية في {target_date}",
                reference=self.code
            )
            
            # 1. من حساب مصروف الإهلاك (مدين)
            JournalItem.objects.create(
                journal_entry=entry,
                account=self.expense_account,
                debit=amount,
                memo=f"مصروف إهلاك {self.name}"
            )
            
            # 2. إلى حساب مجمع الإهلاك (دائن)
            JournalItem.objects.create(
                journal_entry=entry,
                account=self.depreciation_account,
                credit=amount,
                memo=f"مجمع إهلاك {self.name}"
            )
            
            # ترحيل القيد
            entry.post()
            
            # تحديث بيانات الأصل
            self.current_value -= amount
            self.last_depreciation_date = target_date
            self.save()
            
            return entry
