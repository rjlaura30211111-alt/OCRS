-- RESUME: run this if the main script failed on ORLRDD duplicate.
-- Safe to re-run — skips steps already applied.

-- Merge ORLDDD token into ORLRDD (delete typo row if ORLRDD already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'ORLDDD') THEN
    IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'ORLRDD') THEN
      DELETE FROM office_access_tokens WHERE office_code = 'ORLDDD';
    ELSE
      UPDATE office_access_tokens SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';
    END IF;
  END IF;
END $$;

UPDATE documents SET current_office = 'ORLRDD' WHERE current_office = 'ORLDDD';
UPDATE documents SET destination_office = 'ORLRDD' WHERE destination_office = 'ORLDDD';
UPDATE document_routing_logs SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';
UPDATE archived_documents SET current_office = 'ORLRDD' WHERE current_office = 'ORLDDD';
UPDATE archived_documents SET destination_office = 'ORLRDD' WHERE destination_office = 'ORLDDD';
UPDATE archived_documents SET archived_by_office = 'ORLRDD' WHERE archived_by_office = 'ORLDDD';
UPDATE archived_document_routing_logs SET office_code = 'ORLRDD' WHERE office_code = 'ORLDDD';

-- Merge RPRMD-DLOS token into ORPRMD-DLOS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'RPRMD-DLOS') THEN
    IF EXISTS (SELECT 1 FROM office_access_tokens WHERE office_code = 'ORPRMD-DLOS') THEN
      DELETE FROM office_access_tokens WHERE office_code = 'RPRMD-DLOS';
    ELSE
      UPDATE office_access_tokens SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
    END IF;
  END IF;
END $$;

UPDATE documents SET current_office = 'ORPRMD-DLOS' WHERE current_office = 'RPRMD-DLOS';
UPDATE documents SET destination_office = 'ORPRMD-DLOS' WHERE destination_office = 'RPRMD-DLOS';
UPDATE document_routing_logs SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
UPDATE archived_documents SET current_office = 'ORPRMD-DLOS' WHERE current_office = 'RPRMD-DLOS';
UPDATE archived_documents SET destination_office = 'ORPRMD-DLOS' WHERE destination_office = 'RPRMD-DLOS';
UPDATE archived_documents SET archived_by_office = 'ORPRMD-DLOS' WHERE archived_by_office = 'RPRMD-DLOS';
UPDATE archived_document_routing_logs SET office_code = 'ORPRMD-DLOS' WHERE office_code = 'RPRMD-DLOS';
