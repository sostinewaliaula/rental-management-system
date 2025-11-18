-- Expand Property.image to accommodate base64/image URLs
ALTER TABLE `Property`
  MODIFY COLUMN `image` LONGTEXT NULL;

