import models
from database import SessionLocal, engine
import datetime

def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    count = db.query(models.DataSource).count()
    if count == 0:
        ds1 = models.DataSource(
            id="DS-001",
            provider="ISRO Bhuvan",
            dataset="LULC 50K",
            connection_state="LIVE",
            last_updated=datetime.datetime.utcnow(),
            coverage="Maharashtra"
        )
        ds2 = models.DataSource(
            id="DS-002",
            provider="OpenStreetMap",
            dataset="Road Network",
            connection_state="LIVE",
            last_updated=datetime.datetime.utcnow(),
            coverage="Nalasopara"
        )
        ds3 = models.DataSource(
            id="DS-003",
            provider="CARTO",
            dataset="Dark Matter Basemap",
            connection_state="UNAVAILABLE",
            last_updated=datetime.datetime.utcnow(),
            coverage="Global",
            error_status="API Key Required"
        )
        db.add_all([ds1, ds2, ds3])
        db.commit()
    db.close()
    print("Seeded successfully")

if __name__ == "__main__":
    seed()
