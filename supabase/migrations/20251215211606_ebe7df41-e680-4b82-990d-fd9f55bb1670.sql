-- Create CRM tags table (agent-scoped)
CREATE TABLE public.crm_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, name)
);

-- Create customer-tag junction table
CREATE TABLE public.customer_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.crm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(agent_id, customer_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_tags ENABLE ROW LEVEL SECURITY;

-- RLS policies for crm_tags
CREATE POLICY "Agents can view their tags"
ON public.crm_tags FOR SELECT
USING (agent_id = get_agent_id(auth.uid()));

CREATE POLICY "Agents can create tags"
ON public.crm_tags FOR INSERT
WITH CHECK (agent_id = get_agent_id(auth.uid()));

CREATE POLICY "Agents can update their tags"
ON public.crm_tags FOR UPDATE
USING (agent_id = get_agent_id(auth.uid()));

CREATE POLICY "Agents can delete their tags"
ON public.crm_tags FOR DELETE
USING (agent_id = get_agent_id(auth.uid()));

-- RLS policies for customer_tags
CREATE POLICY "Agents can view customer tags"
ON public.customer_tags FOR SELECT
USING (agent_id = get_agent_id(auth.uid()));

CREATE POLICY "Agents can assign tags"
ON public.customer_tags FOR INSERT
WITH CHECK (agent_id = get_agent_id(auth.uid()));

CREATE POLICY "Agents can remove tags"
ON public.customer_tags FOR DELETE
USING (agent_id = get_agent_id(auth.uid()));

-- Prototype policies (for demo mode)
CREATE POLICY "Prototype - view crm_tags"
ON public.crm_tags FOR SELECT USING (agent_id IS NOT NULL);

CREATE POLICY "Prototype - insert crm_tags"
ON public.crm_tags FOR INSERT WITH CHECK (agent_id IS NOT NULL);

CREATE POLICY "Prototype - update crm_tags"
ON public.crm_tags FOR UPDATE USING (agent_id IS NOT NULL);

CREATE POLICY "Prototype - delete crm_tags"
ON public.crm_tags FOR DELETE USING (agent_id IS NOT NULL);

CREATE POLICY "Prototype - view customer_tags"
ON public.customer_tags FOR SELECT USING (agent_id IS NOT NULL);

CREATE POLICY "Prototype - insert customer_tags"
ON public.customer_tags FOR INSERT WITH CHECK (agent_id IS NOT NULL);

CREATE POLICY "Prototype - delete customer_tags"
ON public.customer_tags FOR DELETE USING (agent_id IS NOT NULL);