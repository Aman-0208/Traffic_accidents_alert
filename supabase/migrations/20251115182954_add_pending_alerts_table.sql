/*
  # Add Pending Alerts Table for Approval Flow

  1. New Table
    - `pending_alerts`
      - `id` (uuid, primary key)
      - `stream_id` (uuid, foreign key to streams)
      - `detection_data` (jsonb) - Full detection results including vehicles and collision info
      - `frame_timestamp` (timestamptz) - When accident was detected
      - `confidence` (numeric) - Detection confidence score
      - `status` (text) - pending, approved, rejected
      - `approved_by` (text) - User who approved/rejected
      - `approved_at` (timestamptz)
      - `rejection_reason` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `pending_alerts` table
    - Add policies for public access
    - Create indexes for performance

  3. Notes
    - This table holds accident detections waiting for human approval before creating final alerts
    - Once approved, a corresponding alert is created in the alerts table
*/

CREATE TABLE IF NOT EXISTS pending_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  detection_data jsonb NOT NULL,
  frame_timestamp timestamptz NOT NULL,
  confidence numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by text,
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pending_alerts_stream_id ON pending_alerts(stream_id);
CREATE INDEX IF NOT EXISTS idx_pending_alerts_status ON pending_alerts(status);
CREATE INDEX IF NOT EXISTS idx_pending_alerts_created_at ON pending_alerts(created_at DESC);

ALTER TABLE pending_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to pending_alerts"
  ON pending_alerts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to pending_alerts"
  ON pending_alerts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to pending_alerts"
  ON pending_alerts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to pending_alerts"
  ON pending_alerts FOR DELETE
  TO anon
  USING (true);

CREATE TRIGGER update_pending_alerts_updated_at
  BEFORE UPDATE ON pending_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
