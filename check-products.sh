#!/bin/bash

# Check product prices in database
echo "Checking product prices in database..."

# Using psql to query the database
PGPASSWORD="npg_Ri5Z7zbhCIVy" psql -h ep-quiet-darkness-ah41ix9y-pooler.c-3.us-east-1.aws.neon.tech -U neondb_owner -d neondb -c "SELECT id, slug, name, \"priceCLP\", \"salePriceCLP\", \"priceUSD\", \"salePriceUSD\", \"defaultDurationDays\", \"isActive\" FROM \"Product\";"
