-- Add room_text field to assets table for storing free-text room/location information
-- This allows importing room data from Excel even when it doesn't match existing locations

ALTER TABLE assets ADD COLUMN room_text VARCHAR(200) DEFAULT NULL COMMENT 'ข้อความห้อง/สถานที่ (กรณีที่ import มาแล้วไม่ match location_id)' AFTER location_id;
