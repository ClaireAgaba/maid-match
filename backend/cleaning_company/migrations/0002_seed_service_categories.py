from django.db import migrations, models

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


def seed_categories(apps, schema_editor):
    ServiceCategory = apps.get_model("cleaning_company", "ServiceCategory")
    data = [
        (ServiceCategory.GROUP_HOUSE, HOUSE),
        (ServiceCategory.GROUP_EXTERNAL, EXTERNAL),
        (ServiceCategory.GROUP_FUMIGATION, FUMIGATION),
        (ServiceCategory.GROUP_COMMERCIAL, COMMERCIAL),
    ]
    for group, names in data:
        for name in names:
            ServiceCategory.objects.get_or_create(name=name, defaults={"group": group})


def unseed_categories(apps, schema_editor):
    ServiceCategory = apps.get_model("cleaning_company", "ServiceCategory")
    names = HOUSE + EXTERNAL + FUMIGATION + COMMERCIAL
    ServiceCategory.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("cleaning_company", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="servicecategory",
            name="group",
            field=models.CharField(
                max_length=20,
                choices=[
                    ("house", "House Cleaning Services"),
                    ("external", "External / Compound Services"),
                    ("fumigation", "Fumigation / Pest Control"),
                    ("commercial", "Commercial / Office Cleaning"),
                ],
                default="house",
            ),
            preserve_default=False,
        ),
    ]
