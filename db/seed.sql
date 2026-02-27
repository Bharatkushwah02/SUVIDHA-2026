-- SUVIDHA Municipal Services Demo - Sample Data Seed File (MySQL)

-- Seed birth certificates with different statuses for testing
INSERT INTO certificates (id, type, application_id, person_name, father_name, dob, registered_mobile, status, created_at)
VALUES
  -- Status: ready (can be retrieved via OTP)
  ('550e8400-e29b-41d4-a716-446655440001', 'birth', '1001', 'Rajesh Kumar', 'Ramesh Kumar', '1995-05-15', '9876543210', 'ready', NOW() - INTERVAL 10 DAY),
  
  -- Status: pending (not ready yet - OTP request should show "under verification")
  ('550e8400-e29b-41d4-a716-446655440002', 'birth', '1002', 'Priya Singh', 'Suresh Singh', '2000-03-22', '9123456789', 'pending', NOW() - INTERVAL 2 DAY),
  
  -- Status: collected (already retrieved - shows retrieval code cannot be re-issued)
  ('550e8400-e29b-41d4-a716-446655440003', 'birth', '1003', 'Anil Patel', 'Bhupesh Patel', '1992-11-08', '9988776655', 'collected', NOW() - INTERVAL 20 DAY),
  
  -- Death certificate (ready for retrieval)
  ('550e8400-e29b-41d4-a716-446655440004', 'death', '1004', 'Swami Vivekananda', 'Narasimha', '1863-01-12', '9111111111', 'ready', NOW() - INTERVAL 5 DAY);


-- Seed sample complaints from citizens for testing
INSERT INTO complaints (complaint_id, name, mobile, ward, area, landmark, category, description, created_at)
VALUES
  ('MC-001', 'Vikram Sharma', '9876543211', 'Ward-5', 'Ward-5', 'Near Central Park', 'garbage', 'Garbage not collected for 3 days. Waste piling up. Needs immediate attention.', NOW() - INTERVAL 2 DAY),
  
  ('MC-002', 'Neha Verma', '9123456790', 'Ward-12', 'Ward-12', 'Main Market Street', 'street_light', 'Street light number 45 not working since last week. Road is very dark at night. Safety concern.', NOW() - INTERVAL 1 DAY),
  
  ('MC-003', 'Amit Joshi', '9988776656', 'Ward-8', 'Ward-8', 'Gyan Vihar Lane', 'drainage', 'Drainage pipe burst near house. Water overflow creating puddles on road and nearby properties affected.', NOW() - INTERVAL 6 HOUR);


-- Quick reference for testing:
-- 
-- TEST FLOW 1: Certificate Ready for Retrieval
--   Search by: 1001 OR Name: Rajesh Kumar, Father: Ramesh Kumar, DOB: 1995-05-15
--   Mobile for OTP: 9876543210 (should send OTP to this number)
--   Status: ready → OTP email will be sent → User can generate retrieval code
--
-- TEST FLOW 2: Certificate Pending (No Retrieval Yet)
--   Search by: 1002 OR Name: Priya Singh, Father: Suresh Singh, DOB: 2000-03-22
--   Result: "Certificate is still under verification. Estimated ready by: [date]"
--
-- TEST FLOW 3: Certificate Already Collected
--   Search by: 1003 OR Name: Anil Patel, Father: Bhupesh Patel, DOB: 1992-11-08
--   Result: "Certificate has been collected. Contact office for duplicate."
--
-- TEST FLOW 4: Death Certificate
--   Search by: 1004 OR Name: Swami Vivekananda, Father: Narasimha, DOB: 1863-01-12
--   Process same as Flow 1 (ready for retrieval)
--
-- TEST FLOW 5: Complaints Already Submitted
--   View above 3 complaints in database to verify submission works
--   Mobile numbers for complaint OTP: 9876543211, 9123456790, 9988776656
