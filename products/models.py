from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Store

class Category(models.Model):
    name = models.CharField(_("اسم القسم"), max_length=100)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True,
                             related_name='children', verbose_name=_("القسم الرئيسي"))
    inventory_account = models.ForeignKey('accounting.Account', on_delete=models.PROTECT, null=True, blank=True,
                                        related_name='category_inventories', verbose_name=_("حساب المخزون"))
    cogs_account = models.ForeignKey('accounting.Account', on_delete=models.PROTECT, null=True, blank=True,
                                   related_name='category_cogs', verbose_name=_("حساب تكلفة المبيعات"))
    description = models.TextField(_("الوصف"), blank=True, null=True)

    class Meta:
        verbose_name = _("قسم")
        verbose_name_plural = _("الأقسام")

    def __str__(self):
        if self.parent:
            return f"{self.name} - {self.parent.name}"
        return self.name

class Unit(models.Model):
    name = models.CharField(_("اسم الوحدة"), max_length=255)
    symbol = models.CharField(_("الرمز"), max_length=10)

    class Meta:
        verbose_name = _("وحدة")
        verbose_name_plural = _("وحدات القياس")

    def __str__(self):
        return self.name

class Product(models.Model):
    name = models.CharField(_("اسم المنتج"), max_length=255)
    code = models.CharField(_("كود المنتج"), max_length=50, blank=True, null=True)
    barcode = models.CharField(_("الباركود"), max_length=50, blank=True, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True,
                               related_name='products', verbose_name=_("القسم"))
    default_store = models.ForeignKey(Store, on_delete=models.SET_NULL, blank=True, null=True,
                                    related_name='default_products', verbose_name=_("المخزن الافتراضي"))
    initial_balance = models.DecimalField(_("الرصيد الافتتاحي"), max_digits=15, decimal_places=3, default=0)
    current_balance = models.DecimalField(_("الرصيد الحالي"), max_digits=15, decimal_places=3, default=0)
    image = models.ImageField(_("صورة المنتج"), upload_to='product_images/', blank=True, null=True)
    description = models.TextField(_("الوصف"), blank=True, null=True)
    tax_rate = models.DecimalField(_("نسبة الضريبة"), max_digits=5, decimal_places=2, default=0)
    is_active = models.BooleanField(_("نشط"), default=True)

    class Meta:
        verbose_name = _("منتج")
        verbose_name_plural = _("المنتجات")

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.pk:  # On creation
            self.current_balance = self.initial_balance
        super().save(*args, **kwargs)

class ProductUnit(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='units', verbose_name=_("المنتج"))
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='product_units', verbose_name=_("الوحدة"))
    conversion_factor = models.DecimalField(_("معامل التحويل"), max_digits=10, decimal_places=3, default=1)
    purchase_price = models.DecimalField(_("سعر الشراء"), max_digits=15, decimal_places=2, default=0)
    selling_price = models.DecimalField(_("سعر البيع"), max_digits=15, decimal_places=2, default=0)
    barcode = models.CharField(_("باركود الوحدة"), max_length=50, blank=True, null=True)
    is_default_purchase = models.BooleanField(_("وحدة الشراء الافتراضية"), default=False)
    is_default_sale = models.BooleanField(_("وحدة البيع الافتراضية"), default=False)

    class Meta:
        verbose_name = _("وحدة المنتج")
        verbose_name_plural = _("وحدات المنتجات")
        unique_together = [['product', 'unit']]

    def __str__(self):
        return f"{self.product.name} - {self.unit.name}"

    def save(self, *args, **kwargs):
        # تخزين حالة الوحدة قبل الحفظ
        is_new = self.pk is None
        print(f"🔍 حفظ وحدة المنتج: {self.unit.name if hasattr(self, 'unit') and self.unit else 'وحدة جديدة'} للمنتج {self.product.name if hasattr(self, 'product') and self.product else 'منتج جديد'}")
        print(f"📊 حالة الوحدة - جديدة: {is_new}, وحدة شراء افتراضية: {self.is_default_purchase}, وحدة بيع افتراضية: {self.is_default_sale}")

        try:
            # حفظ الوحدة أولاً
            super().save(*args, **kwargs)
            print(f"✅ تم حفظ وحدة المنتج بنجاح (ID: {self.pk})")

            # إذا تم تعيين هذه الوحدة كوحدة شراء افتراضية، قم بإلغاء تعيين الوحدات الأخرى
            if self.is_default_purchase:
                updated = ProductUnit.objects.filter(
                    product=self.product,
                    is_default_purchase=True
                ).exclude(pk=self.pk).update(is_default_purchase=False)
                print(f"📊 تم إلغاء تعيين {updated} وحدة أخرى كوحدة شراء افتراضية")

            # إذا تم تعيين هذه الوحدة كوحدة بيع افتراضية، قم بإلغاء تعيين الوحدات الأخرى
            if self.is_default_sale:
                updated = ProductUnit.objects.filter(
                    product=self.product,
                    is_default_sale=True
                ).exclude(pk=self.pk).update(is_default_sale=False)
                print(f"📊 تم إلغاء تعيين {updated} وحدة أخرى كوحدة بيع افتراضية")

            # إذا لم يتم تعيين أي وحدة كوحدة افتراضية للشراء أو البيع، قم بتعيين هذه الوحدة كافتراضية
            # نقوم بهذا الفحص سواء كانت الوحدة جديدة أو قديمة
            # التحقق من وجود وحدة شراء افتراضية
            has_default_purchase = ProductUnit.objects.filter(
                product=self.product,
                is_default_purchase=True
            ).exists()
            print(f"📊 هل يوجد وحدة شراء افتراضية: {has_default_purchase}")

            # التحقق من وجود وحدة بيع افتراضية
            has_default_sale = ProductUnit.objects.filter(
                product=self.product,
                is_default_sale=True
            ).exists()
            print(f"📊 هل يوجد وحدة بيع افتراضية: {has_default_sale}")

            # إذا لم يكن هناك وحدة شراء افتراضية، قم بتعيين هذه الوحدة كافتراضية
            if not has_default_purchase:
                self.is_default_purchase = True
                print(f"📝 تعيين الوحدة كوحدة شراء افتراضية")
                super().save(update_fields=['is_default_purchase'])

            # إذا لم يكن هناك وحدة بيع افتراضية، قم بتعيين هذه الوحدة كافتراضية
            if not has_default_sale:
                self.is_default_sale = True
                print(f"📝 تعيين الوحدة كوحدة بيع افتراضية")
                super().save(update_fields=['is_default_sale'])

            print(f"✅ اكتملت عملية حفظ وحدة المنتج بنجاح")
        except Exception as e:
            print(f"❌ حدث خطأ أثناء حفظ وحدة المنتج: {str(e)}")
            raise
