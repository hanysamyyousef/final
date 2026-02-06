from django.core.management.base import BaseCommand
from accounting.models import Account
from core.models import SystemSettings, Company, Branch, Store, Safe
from django.db import transaction

class Command(BaseCommand):
    help = 'بناء دليل الحسابات المتعارف عليه وربطه بمكونات النظام'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('بدء عملية بناء دليل الحسابات...'))
        
        try:
            with transaction.atomic():
                # 1. الأصول (1)
                assets, _ = Account.objects.get_or_create(
                    code='1', 
                    defaults={'name': 'الأصول', 'account_type': 'asset', 'is_selectable': False}
                )
                
                # 11 الأصول المتداولة
                current_assets, _ = Account.objects.get_or_create(
                    code='11', 
                    defaults={'name': 'الأصول المتداولة', 'account_type': 'asset', 'parent': assets, 'is_selectable': False}
                )
                
                # 111 الصناديق والبنوك
                cash_banks, _ = Account.objects.get_or_create(
                    code='111', 
                    defaults={'name': 'الصناديق والبنوك', 'account_type': 'asset', 'parent': current_assets, 'is_selectable': False}
                )
                
                # 112 العملاء والمدينون
                receivables, _ = Account.objects.get_or_create(
                    code='112', 
                    defaults={'name': 'العملاء والمدينون', 'account_type': 'asset', 'parent': current_assets, 'is_selectable': False}
                )
                
                # 113 المخزون
                inventory, _ = Account.objects.get_or_create(
                    code='113', 
                    defaults={'name': 'المخزون', 'account_type': 'asset', 'parent': current_assets, 'is_selectable': False}
                )

                # 12 الأصول الثابتة
                fixed_assets, _ = Account.objects.get_or_create(
                    code='12', 
                    defaults={'name': 'الأصول الثابتة', 'account_type': 'asset', 'parent': assets, 'is_selectable': False}
                )

                # 2. الخصوم (2)
                liabilities, _ = Account.objects.get_or_create(
                    code='2', 
                    defaults={'name': 'الخصوم', 'account_type': 'liability', 'is_selectable': False}
                )
                
                # 21 الخصوم المتداولة
                current_liabilities, _ = Account.objects.get_or_create(
                    code='21', 
                    defaults={'name': 'الخصوم المتداولة', 'account_type': 'liability', 'parent': liabilities, 'is_selectable': False}
                )
                
                # 211 الموردون والدائنون
                payables, _ = Account.objects.get_or_create(
                    code='211', 
                    defaults={'name': 'الموردون والدائنون', 'account_type': 'liability', 'parent': current_liabilities, 'is_selectable': False}
                )

                # 3. حقوق الملكية (3)
                equity, _ = Account.objects.get_or_create(
                    code='3', 
                    defaults={'name': 'حقوق الملكية', 'account_type': 'equity', 'is_selectable': False}
                )
                
                # 31 رأس المال
                capital, _ = Account.objects.get_or_create(
                    code='31', 
                    defaults={'name': 'رأس المال', 'account_type': 'equity', 'parent': equity, 'is_selectable': True}
                )

                # 4. الإيرادات (4)
                revenues, _ = Account.objects.get_or_create(
                    code='4', 
                    defaults={'name': 'الإيرادات', 'account_type': 'income', 'is_selectable': False}
                )
                
                # 41 المبيعات
                sales_rev, _ = Account.objects.get_or_create(
                    code='41', 
                    defaults={'name': 'المبيعات', 'account_type': 'income', 'parent': revenues, 'is_selectable': True}
                )

                # 5. المصروفات (5)
                expenses, _ = Account.objects.get_or_create(
                    code='5', 
                    defaults={'name': 'المصروفات', 'account_type': 'expense', 'is_selectable': False}
                )
                
                # 51 تكلفة البضاعة المباعة
                cogs, _ = Account.objects.get_or_create(
                    code='51', 
                    defaults={'name': 'تكلفة البضاعة المباعة', 'account_type': 'expense', 'parent': expenses, 'is_selectable': True}
                )
                
                # 52 مصروفات عمومية وإدارية
                admin_expenses, _ = Account.objects.get_or_create(
                    code='52', 
                    defaults={'name': 'مصروفات عمومية وإدارية', 'account_type': 'expense', 'parent': expenses, 'is_selectable': True}
                )

                # ربط الحسابات بالإعدادات العامة
                settings = SystemSettings.get_settings()
                settings.sales_account = sales_rev
                settings.cogs_account = cogs
                settings.default_expense_account = admin_expenses
                settings.default_income_account = sales_rev
                
                # إنشاء حسابات ضرائب افتراضية
                vat_out, _ = Account.objects.get_or_create(
                    code='212', 
                    defaults={'name': 'ضريبة القيمة المضافة - مخرجات', 'account_type': 'liability', 'parent': current_liabilities, 'is_selectable': True}
                )
                vat_in, _ = Account.objects.get_or_create(
                    code='114', 
                    defaults={'name': 'ضريبة القيمة المضافة - مدخلات', 'account_type': 'asset', 'parent': current_assets, 'is_selectable': True}
                )
                
                settings.vat_output_account = vat_out
                settings.vat_input_account = vat_in
                settings.save()

                self.stdout.write(self.style.SUCCESS('تم بناء الدليل الأساسي وربط الإعدادات.'))

                # ربط الخزن القائمة
                for safe in Safe.objects.all():
                    if not safe.account:
                        acc_code = f"111{safe.id:03}"
                        acc, _ = Account.objects.get_or_create(
                            code=acc_code,
                            defaults={'name': f'خزنة - {safe.name}', 'account_type': 'asset', 'parent': cash_banks, 'is_selectable': True}
                        )
                        safe.account = acc
                        safe.save()

                # ربط المخازن القائمة
                for store in Store.objects.all():
                    if not store.account:
                        acc_code = f"113{store.id:03}"
                        acc, _ = Account.objects.get_or_create(
                            code=acc_code,
                            defaults={'name': f'مخزن - {store.name}', 'account_type': 'asset', 'parent': inventory, 'is_selectable': True}
                        )
                        store.account = acc
                        store.save()

                self.stdout.write(self.style.SUCCESS('تم ربط الخزن والمخازن بنجاح.'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'حدث خطأ: {str(e)}'))
