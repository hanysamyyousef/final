from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Contact, Store, Safe, Bank, SystemSettings
from accounting.models import Account
import logging
from django.db import transaction

logger = logging.getLogger(__name__)

@receiver(post_delete, sender=Contact)
def delete_contact_accounts(sender, instance, **kwargs):
    """حذف الحسابات المحاسبية المرتبطة بجهة الاتصال إذا كانت فارغة"""
    accounts_to_check = []
    if instance.customer_account:
        accounts_to_check.append(instance.customer_account)
    if instance.supplier_account:
        accounts_to_check.append(instance.supplier_account)
    if instance.account:
        accounts_to_check.append(instance.account)

    for acc in accounts_to_check:
        try:
            # التحقق من عدم وجود قيود محاسبية
            if not acc.journal_items.exists():
                acc.delete()
                logger.info(f"تم حذف الحساب المحاسبي الفارغ: {acc.name} بعد حذف جهة الاتصال")
        except Exception as e:
            logger.error(f"فشل حذف الحساب {acc.name}: {str(e)}")

def create_related_account(account_name, parent_account, account_type):
    """
    دالة مساعدة لإنشاء حساب محاسبي وإرجاعه
    """
    if parent_account:
        try:
            # توليد كود فريد للحساب الجديد بناءً على كود الحساب الأب
            last_child = Account.objects.filter(parent=parent_account).order_by('-code').first()
            if last_child:
                try:
                    # محاولة زيادة الجزء الأخير من الكود
                    code_prefix = parent_account.code
                    last_code_suffix = last_child.code[len(code_prefix):]
                    if last_code_suffix.isdigit():
                        new_suffix = str(int(last_code_suffix) + 1).zfill(len(last_code_suffix))
                        new_code = code_prefix + new_suffix
                    else:
                        new_code = f"{parent_account.code}{Account.objects.filter(parent=parent_account).count() + 1:03d}"
                except Exception:
                    new_code = f"{parent_account.code}{Account.objects.filter(parent=parent_account).count() + 1:03d}"
            else:
                new_code = f"{parent_account.code}001"

            # إنشاء الحساب الجديد
            account = Account.objects.create(
                name=account_name,
                code=new_code,
                account_type=account_type or parent_account.account_type,
                parent=parent_account,
                is_selectable=True
            )
            logger.info(f"تم إنشاء حساب محاسبي جديد: {new_code} - {account_name}")
            return account
        except Exception as e:
            logger.error(f"خطأ أثناء إنشاء حساب محاسبي لـ {account_name}: {str(e)}")
            return None
    return None

@receiver(post_save, sender=Contact)
def handle_contact_account(sender, instance, created, **kwargs):
    """إنشاء حساب تلقائي للعميل أو المورد عند الإضافة أو التعديل"""
    settings = SystemSettings.get_settings()
    update_fields = []

    # حساب العميل
    if instance.contact_type in [Contact.CUSTOMER, Contact.BOTH] and not instance.customer_account:
        parent_account = settings.default_customer_account
        if parent_account:
            acc = create_related_account(instance.name, parent_account, 'asset')
            if acc:
                instance.customer_account = acc
                update_fields.append('customer_account')
    
    # حساب المورد
    if instance.contact_type in [Contact.SUPPLIER, Contact.BOTH] and not instance.supplier_account:
        parent_account = settings.default_supplier_account
        if parent_account:
            acc = create_related_account(instance.name, parent_account, 'liability')
            if acc:
                instance.supplier_account = acc
                update_fields.append('supplier_account')

    if update_fields:
        # استخدام update() لتجنب استدعاء الإشارة مرة أخرى بشكل لا نهائي
        Contact.objects.filter(pk=instance.pk).update(**{field: getattr(instance, field) for field in update_fields})

@receiver(post_save, sender=Store)
def handle_store_account(sender, instance, created, **kwargs):
    """إنشاء حساب تلقائي للمخزن عند الإضافة"""
    if created and not instance.account:
        settings = SystemSettings.get_settings()
        parent_account = settings.default_warehouse_account
        if parent_account:
            acc = create_related_account(f"مخزن {instance.name}", parent_account, 'asset')
            if acc:
                instance.account = acc
                instance.save(update_fields=['account'])

@receiver(post_save, sender=Safe)
def handle_safe_account(sender, instance, created, **kwargs):
    """إنشاء حساب تلقائي للخزنة عند الإضافة"""
    if created and not instance.account:
        settings = SystemSettings.get_settings()
        parent_account = settings.default_safe_account
        if parent_account:
            acc = create_related_account(f"خزنة {instance.name}", parent_account, 'asset')
            if acc:
                instance.account = acc
                instance.save(update_fields=['account'])

@receiver(post_save, sender=Bank)
def handle_bank_account(sender, instance, created, **kwargs):
    """إنشاء حساب تلقائي للبنك عند الإضافة"""
    if created and not instance.account:
        settings = SystemSettings.get_settings()
        parent_account = settings.default_bank_account
        if parent_account:
            acc = create_related_account(f"بنك {instance.name}", parent_account, 'asset')
            if acc:
                instance.account = acc
                instance.save(update_fields=['account'])
