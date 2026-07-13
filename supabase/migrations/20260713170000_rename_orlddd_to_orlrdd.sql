-- Rename mistyped office ORLDDD to ORLRDD across active and archived data

UPDATE office_access_tokens
SET office_code = 'ORLRDD'
WHERE office_code = 'ORLDDD';

UPDATE documents
SET current_office = 'ORLRDD'
WHERE current_office = 'ORLDDD';

UPDATE documents
SET destination_office = 'ORLRDD'
WHERE destination_office = 'ORLDDD';

UPDATE document_routing_logs
SET office_code = 'ORLRDD'
WHERE office_code = 'ORLDDD';

UPDATE archived_documents
SET current_office = 'ORLRDD'
WHERE current_office = 'ORLDDD';

UPDATE archived_documents
SET destination_office = 'ORLRDD'
WHERE destination_office = 'ORLDDD';

UPDATE archived_documents
SET archived_by_office = 'ORLRDD'
WHERE archived_by_office = 'ORLDDD';

UPDATE archived_document_routing_logs
SET office_code = 'ORLRDD'
WHERE office_code = 'ORLDDD';
