/*
  # Create Traffic Surveillance System Tables

  1. New Tables
    - `streams`
      - `id` (uuid, primary key)
      - `url` (text, required) - Video stream URL
      - `location` (text, required) - Stream location name
      - `latitude` (numeric) - GPS latitude
      - `longitude` (numeric) - GPS longitude
      - `status` (text) - Stream status: active, inactive, error, alert
      - `is_processing` (boolean) - Whether ML processing is active
      - `last_processed` (timestamptz) - Last time frame was processed
      - `accident_count` (integer) - Total accidents detected
      - `description` (text) - Optional description
      - `tags` (text[]) - Array of tags
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `alerts`
      - `id` (uuid, primary key)
      - `stream_id` (uuid, foreign key to streams)
      - `location` (text, required)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `severity` (text) - low, medium, high, critical
      - `status` (text) - pending, sent, acknowledged, resolved
      - `type` (text) - accident, traffic_jam, weather, system
      - `confidence` (numeric) - ML detection confidence
      - `detection_data` (jsonb) - Full detection results
      - `description` (text)
      - `sent_at` (timestamptz)
      - `acknowledged_at` (timestamptz)
      - `resolved_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (this is a demo/monitoring system)
    - Create indexes for performance
*/

-- Create streams table
CREATE TABLE IF NOT EXISTS streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  status text NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'alert')),
  is_processing boolean DEFAULT false,
  last_processed timestamptz,
  accident_count integer DEFAULT 0,
  description text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  location text NOT NULL,
  latitude numeric,
  longitude numeric,
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'acknowledged', 'resolved')),
  type text NOT NULL DEFAULT 'accident' CHECK (type IN ('accident', 'traffic_jam', 'weather', 'system')),
  confidence numeric,
  detection_data jsonb,
  description text,
  sent_at timestamptz,
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);
CREATE INDEX IF NOT EXISTS idx_streams_location ON streams(location);
CREATE INDEX IF NOT EXISTS idx_streams_created_at ON streams(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_stream_id ON alerts(stream_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Enable Row Level Security
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (monitoring system)
CREATE POLICY "Allow public read access to streams"
  ON streams FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to streams"
  ON streams FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to streams"
  ON streams FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to streams"
  ON streams FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to alerts"
  ON alerts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to alerts"
  ON alerts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to alerts"
  ON alerts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to alerts"
  ON alerts FOR DELETE
  TO anon
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_streams_updated_at
  BEFORE UPDATE ON streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
