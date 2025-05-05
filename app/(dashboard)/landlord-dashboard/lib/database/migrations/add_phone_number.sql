-- Add phone_number column to properties table
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add comment for the new column
COMMENT ON COLUMN public.properties.phone_number IS 'Contact phone number for the landlord of this property';

-- Update the add_property function to include phone_number parameter
CREATE OR REPLACE FUNCTION add_property(
  name TEXT,
  location TEXT,
  property_type TEXT,
  bedrooms INTEGER,
  bathrooms DECIMAL,
  description TEXT,
  monthly_rent DECIMAL,
  security_deposit DECIMAL,
  utilities JSONB,
  images JSONB,
  phone_number TEXT DEFAULT NULL  -- Added phone_number parameter with default NULL
) RETURNS UUID AS $$
DECLARE
  landlord_id UUID;
  new_property_id UUID;
  is_landlord BOOLEAN;
BEGIN
  -- Get the current user's ID
  landlord_id := auth.uid();
  
  -- Check if the user is a landlord
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = landlord_id
    AND profiles.user_role = 'landlord'
  ) INTO is_landlord;
  
  -- If not a landlord, raise an exception
  IF NOT is_landlord THEN
    RAISE EXCEPTION 'Only landlords can add properties';
  END IF;
  
  -- Insert the new property
  INSERT INTO properties (
    landlord_id,
    name,
    location,
    property_type,
    bedrooms,
    bathrooms,
    description,
    monthly_rent,
    security_deposit,
    utilities,
    images,
    phone_number  -- Added phone_number field
  ) VALUES (
    landlord_id,
    name,
    location,
    property_type,
    bedrooms,
    bathrooms,
    description,
    monthly_rent,
    security_deposit,
    utilities,
    images,
    phone_number  -- Added phone_number value
  ) RETURNING id INTO new_property_id;
  
  RETURN new_property_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
