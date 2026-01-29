from django.core.management.base import BaseCommand
from django.utils import timezone
from accounting.models import FixedAsset

class Command(BaseCommand):
    help = 'Run depreciation for all active fixed assets'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS(f'Starting depreciation run at {timezone.now()}'))
        
        assets = FixedAsset.objects.filter(is_active=True)
        count = 0
        
        for asset in assets:
            try:
                entry = asset.post_depreciation()
                if entry:
                    self.stdout.write(self.style.SUCCESS(f'Successfully ran depreciation for asset: {asset.name} - Entry: {entry.entry_number}'))
                    count += 1
                else:
                    self.stdout.write(self.style.WARNING(f'No depreciation due for asset: {asset.name}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error running depreciation for asset {asset.name}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'Depreciation run completed. {count} assets processed.'))
