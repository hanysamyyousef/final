
import os
import django
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'acc.settings')
django.setup()

from invoices.models import Invoice
from finances.models import ProductTransaction, ContactTransaction, SafeTransaction

def check_invoices():
    invoices = Invoice.objects.all()
    print(f"Total Invoices: {invoices.count()}")
    
    posted_with_no_trans = 0
    for inv in invoices:
        pt = ProductTransaction.objects.filter(invoice=inv).count()
        ct = ContactTransaction.objects.filter(invoice=inv).count()
        st = SafeTransaction.objects.filter(invoice=inv).count()
        
        print(f"Invoice {inv.number} - Posted: {inv.is_posted}, PT: {pt}, CT: {ct}, ST: {st}")
        
        if inv.is_posted and pt == 0:
            posted_with_no_trans += 1
            
    print(f"Invoices posted but missing ProductTransactions: {posted_with_no_trans}")

if __name__ == "__main__":
    check_invoices()
