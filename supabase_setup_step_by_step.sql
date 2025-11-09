-- ============================================
-- STEP 1: Create the table
-- ============================================
-- If the table already exists, you can skip this step or drop it first:
-- DROP TABLE IF EXISTS wishlist_items CASCADE;

CREATE TABLE wishlist_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price TEXT,
    url TEXT,
    image_url TEXT,
    is_reserved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STEP 2: Enable Row Level Security
-- ============================================
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create policies (run these one at a time if needed)
-- ============================================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON wishlist_items;
DROP POLICY IF EXISTS "Allow public update reservations" ON wishlist_items;

-- Create read policy
CREATE POLICY "Allow public read access" ON wishlist_items
    FOR SELECT
    USING (true);

-- Create update policy
CREATE POLICY "Allow public update reservations" ON wishlist_items
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- ============================================
-- STEP 4: Create the reserve function
-- ============================================
CREATE OR REPLACE FUNCTION reserve_wishlist_item(item_id_to_reserve TEXT)
RETURNS TEXT AS $$
DECLARE
    current_status BOOLEAN;
BEGIN
    SELECT is_reserved INTO current_status
    FROM wishlist_items
    WHERE id = item_id_to_reserve;

    IF current_status IS NULL THEN
        RETURN 'ITEM_NOT_FOUND';
    END IF;

    IF current_status = TRUE THEN
        RETURN 'ALREADY_RESERVED';
    END IF;

    UPDATE wishlist_items
    SET is_reserved = TRUE,
        updated_at = NOW()
    WHERE id = item_id_to_reserve;

    RETURN 'SUCCESS';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 5: Create the trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Create the trigger
-- ============================================
DROP TRIGGER IF EXISTS update_wishlist_items_updated_at ON wishlist_items;

CREATE TRIGGER update_wishlist_items_updated_at
    BEFORE UPDATE ON wishlist_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: Insert sample data (optional)
-- ============================================
INSERT INTO wishlist_items (id, title, description, price, url, image_url, is_reserved) VALUES
    ('item001', 'Filament', 'Rainbow 3D Printer filament.', '$22.49', 'https://us.store.bambulab.com/products/pla-silk-multi-color?id=601310725769670660', 'https://store.bblcdn.com/s7/default/ea5b14159996424eb6deb780bc2e12cc/Dawn_Radiance.jpg__op__resize,m_lfit,w_750__op__format,f_auto__op__quality,q_80', FALSE),
    ('item002', 'Filament', 'Red 3D Printer filament.', '$19.99', 'https://us.store.bambulab.com/products/pla-basic-filament?id=43045591679112', 'https://store.bblcdn.com/s7/default/ee52b43861ef45849965b6dcdd87b617/MaroonRed.jpg__op__resize,m_lfit,w_750__op__format,f_auto__op__quality,q_80', FALSE)
ON CONFLICT (id) DO NOTHING;

