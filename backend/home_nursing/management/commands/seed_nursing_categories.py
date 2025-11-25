from django.core.management.base import BaseCommand
from home_nursing.models import NursingServiceCategory as Cat

ELDERLY = [
    "Feeding assistance",
    "Bathing & dressing",
    "Mobility support",
    "Toilet assistance",
    "Medication reminders",
    "Companionship",
    "Bed sore care (if trained)",
]

POST_SURGERY = [
    "Wound dressing",
    "Medication administration",
    "Monitoring vitals",
    "Catheter care",
    "Physio support (basic): movement exercises",
]

SPECIAL_NEEDS = [
    "Children with disabilities",
    "Autism support",
    "Cerebral palsy care",
    "Epilepsy monitoring",
]

BABY_INFANT = [
    "Newborn care",
    "Feeding & hygiene",
    "Night nurse (baby night shift care)",
    "Vaccination reminder & follow-up",
]

PALLIATIVE = [
    "Pain management support",
    "Comfort care",
    "Emotional support for family",
]

HOME_MEDICAL = [
    "Giving injections",
    "Checking blood pressure",
    "Managing chronic illnesses (diabetes, hypertension)",
]


class Command(BaseCommand):
    help = "Seed nursing service categories grouped for Uganda context"

    def handle(self, *args, **options):
        grouped = [
            (Cat.GROUP_ELDERLY, ELDERLY),
            (Cat.GROUP_POST_SURGERY, POST_SURGERY),
            (Cat.GROUP_SPECIAL_NEEDS, SPECIAL_NEEDS),
            (Cat.GROUP_BABY_INFANT, BABY_INFANT),
            (Cat.GROUP_PALLIATIVE, PALLIATIVE),
            (Cat.GROUP_HOME_MEDICAL, HOME_MEDICAL),
        ]
        created = 0
        for group, names in grouped:
            for name in names:
                obj, was_created = Cat.objects.get_or_create(name=name, defaults={"group": group})
                if not was_created and obj.group != group:
                    obj.group = group
                    obj.save(update_fields=["group"])
                created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded nursing categories. New: {created}"))
