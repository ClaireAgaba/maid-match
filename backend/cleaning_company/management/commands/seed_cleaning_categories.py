from django.core.management.base import BaseCommand
from cleaning_company.models import ServiceCategory

HOUSE = [
    "General home cleaning",
    "Deep cleaning",
    "Move-in / move-out cleaning",
    "Post-construction cleaning",
    "Sofa / couch cleaning",
    "Mattress deep cleaning",
    "Carpet cleaning",
    "Tile scrubbing & stain removal",
    "Wall cleaning",
    "Window cleaning",
    "Bathroom deep cleaning",
    "Kitchen degreasing",
]

LAUNDRY = [
    "Laundry washing",
    "Ironing",
    "Dry cleaning pickup/drop-off",
]

EXTERNAL = [
    "Lawn mowing",
    "Hedge trimming",
    "Compound sweeping",
    "Garbage removal",
    "Minor outdoor cleaning",
    "Pressure washing (pavements / veranda)",
]

FUMIGATION = [
    "Ants control",
    "Cockroach extermination",
    "Bedbug treatment",
    "Mosquito control",
    "Rodent control",
    "Termite control",
    "General fumigation package",
]

COMMERCIAL = [
    "Office cleaning",
    "School cleaning",
    "Apartment cleaning",
    "Shop cleaning",
    "Restaurant cleaning",
    "Warehouse cleaning",
    "Public building cleaning",
]


class Command(BaseCommand):
    help = "Seed cleaning service categories grouped for Uganda context"

    def handle(self, *args, **options):
        data = [
            (ServiceCategory.GROUP_HOUSE, HOUSE),
            (ServiceCategory.GROUP_EXTERNAL, EXTERNAL),
            (ServiceCategory.GROUP_FUMIGATION, FUMIGATION),
            (ServiceCategory.GROUP_COMMERCIAL, COMMERCIAL),
            (ServiceCategory.GROUP_LAUNDRY, LAUNDRY),
        ]
        created = 0
        for group, names in data:
            for name in names:
                obj, was_created = ServiceCategory.objects.get_or_create(
                    name=name, defaults={"group": group}
                )
                if not was_created and obj.group != group:
                    obj.group = group
                    obj.save(update_fields=["group"])
                created += int(was_created)
        self.stdout.write(self.style.SUCCESS(f"Seeded categories. New: {created}"))
