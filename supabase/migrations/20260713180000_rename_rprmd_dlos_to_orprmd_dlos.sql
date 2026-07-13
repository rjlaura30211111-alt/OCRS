-- Remove duplicate office code RPRMD-DLOS; standardize as ORPRMD-DLOS

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

UPDATE documents
SET current_office = 'ORPRMD-DLOS'
WHERE current_office = 'RPRMD-DLOS';

UPDATE documents
SET destination_office = 'ORPRMD-DLOS'
WHERE destination_office = 'RPRMD-DLOS';

UPDATE document_routing_logs
SET office_code = 'ORPRMD-DLOS'
WHERE office_code = 'RPRMD-DLOS';

UPDATE archived_documents
SET current_office = 'ORPRMD-DLOS'
WHERE current_office = 'RPRMD-DLOS';

UPDATE archived_documents
SET destination_office = 'ORPRMD-DLOS'
WHERE destination_office = 'RPRMD-DLOS';

UPDATE archived_documents
SET archived_by_office = 'ORPRMD-DLOS'
WHERE archived_by_office = 'RPRMD-DLOS';

UPDATE archived_document_routing_logs
SET office_code = 'ORPRMD-DLOS'
WHERE office_code = 'RPRMD-DLOS';
