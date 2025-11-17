from django.core.management.base import BaseCommand
from accounts.models import User
from maid.models import MaidProfile
from homeowner.models import HomeownerProfile


class Command(BaseCommand):
    help = 'Creates test users for development'

    def handle(self, *args, **kwargs):
        # Create admin user
        if not User.objects.filter(username='admin').exists():
            admin = User.objects.create_superuser(
                username='admin',
                email='admin@maidmatch.com',
                password='admin123',
                user_type='admin'
            )
            self.stdout.write(self.style.SUCCESS(f'Created admin user: admin / admin123'))
        
        # Create maid user
        if not User.objects.filter(username='maid1').exists():
            maid_user = User.objects.create_user(
                username='maid1',
                email='maid1@maidmatch.com',
                password='maid123',
                user_type='maid',
                phone_number='+254700000001',
                is_verified=True
            )
            MaidProfile.objects.create(
                user=maid_user,
                bio='Experienced maid with 5 years of service',
                experience_years=5,
                hourly_rate=15.00,
                skills='Cleaning, Cooking, Laundry',
                availability_status=True
            )
            self.stdout.write(self.style.SUCCESS(f'Created maid user: maid1 / maid123'))
        
        # Create homeowner user
        if not User.objects.filter(username='homeowner1').exists():
            homeowner_user = User.objects.create_user(
                username='homeowner1',
                email='homeowner1@maidmatch.com',
                password='home123',
                user_type='homeowner',
                phone_number='+254700000002',
                is_verified=True
            )
            HomeownerProfile.objects.create(
                user=homeowner_user,
                home_address='123 Main Street, Nairobi',
                home_type='apartment',
                number_of_rooms=3,
                preferred_maid_gender='any'
            )
            self.stdout.write(self.style.SUCCESS(f'Created homeowner user: homeowner1 / home123'))
        
        self.stdout.write(self.style.SUCCESS('\n=== Test Users Created Successfully ==='))
        self.stdout.write('Admin: admin / admin123')
        self.stdout.write('Maid: maid1 / maid123')
        self.stdout.write('Homeowner: homeowner1 / home123')
