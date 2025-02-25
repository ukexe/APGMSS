import { supabase } from './supabase';
import type { Database } from '../types/supabase';

type WorkflowState = Database['public']['Enums']['workflow_state'];

export async function initializeWorkflow(grievanceId: string, categoryId: number) {
  try {
    // Get workflow template for the category
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('workflow_states')
      .eq('category_id', categoryId)
      .single();

    if (templateError) throw templateError;

    // Initialize workflow with first state
    const initialState = template.workflow_states[0];
    const { data, error } = await supabase
      .from('grievance_workflows')
      .insert([
        {
          grievance_id: grievanceId,
          current_state: initialState,
          state_history: JSON.stringify([{
            state: initialState,
            timestamp: new Date().toISOString(),
            notes: 'Workflow initialized'
          }])
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error initializing workflow:', error);
    throw error;
  }
}

export async function updateWorkflowState(
  grievanceId: string,
  newState: WorkflowState,
  notes?: string,
  assignedTo?: string
) {
  try {
    // Get current workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('grievance_workflows')
      .select('state_history, current_state')
      .eq('grievance_id', grievanceId)
      .single();

    if (workflowError) throw workflowError;

    // Update state history
    const stateHistory = JSON.parse(workflow.state_history);
    stateHistory.push({
      state: newState,
      timestamp: new Date().toISOString(),
      notes: notes || `State updated to ${newState}`,
      assignedTo
    });

    // Update workflow
    const { data, error } = await supabase
      .from('grievance_workflows')
      .update({
        current_state: newState,
        state_history: JSON.stringify(stateHistory),
        assigned_to: assignedTo,
        notes: notes
      })
      .eq('grievance_id', grievanceId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating workflow state:', error);
    throw error;
  }
}

export async function getWorkflowTemplate(categoryId: number) {
  try {
    const { data, error } = await supabase
      .from('workflow_templates')
      .select('workflow_states')
      .eq('category_id', categoryId)
      .single();

    if (error) throw error;
    return data.workflow_states;
  } catch (error) {
    console.error('Error fetching workflow template:', error);
    throw error;
  }
}

export async function getWorkflowHistory(grievanceId: string) {
  try {
    const { data, error } = await supabase
      .from('grievance_workflows')
      .select(`
        *,
        assigned_to:auth_users(id, email)
      `)
      .eq('grievance_id', grievanceId)
      .single();

    if (error) throw error;
    return {
      currentState: data.current_state,
      history: JSON.parse(data.state_history),
      assignedTo: data.assigned_to
    };
  } catch (error) {
    console.error('Error fetching workflow history:', error);
    throw error;
  }
}

export async function getNextWorkflowStates(grievanceId: string): Promise<WorkflowState[]> {
  try {
    // Get current workflow and template
    const { data: workflow, error: workflowError } = await supabase
      .from('grievance_workflows')
      .select(`
        current_state,
        grievances!inner(category_id)
      `)
      .eq('grievance_id', grievanceId)
      .single();

    if (workflowError) throw workflowError;

    // Get workflow template
    const { data: template, error: templateError } = await supabase
      .from('workflow_templates')
      .select('workflow_states')
      .eq('category_id', workflow.grievances.category_id)
      .single();

    if (templateError) throw templateError;

    // Find current state index
    const currentIndex = template.workflow_states.indexOf(workflow.current_state);
    
    // Return next possible states (current and next state)
    return template.workflow_states.slice(currentIndex, currentIndex + 2);
  } catch (error) {
    console.error('Error getting next workflow states:', error);
    throw error;
  }
} 