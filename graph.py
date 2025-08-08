from typing import Tuple
from burr.core import State, default, when
from burr.core.action import action
from burr.core.graph import GraphBuilder

@action(reads=[], writes=[])
def prompt(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def check_safety(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def unsafe_response(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def decide_mode(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def update_project_name(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def run_eligibility_check(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def upload_ifc_file(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def upload_structural_notes(state: State) -> Tuple[dict, State]:
    return {}, state

@action(reads=[], writes=[])
def unknown_intent(state: State) -> Tuple[dict, State]:
    return {}, state

def create_burr_graph():
    """Create the Burr graph for the project."""
    return (
      GraphBuilder()
      .with_actions(
          prompt,
          check_safety,
          unsafe_response,
          decide_mode,
          update_project_name,
          run_eligibility_check,
          upload_ifc_file,
          upload_structural_notes,
          unknown_intent,
      )
      .with_transitions(
          ("prompt", "check_safety", default),
          ("check_safety", "decide_mode", when(safe=True)),
          ("check_safety", "unsafe_response", default),
          ("decide_mode", "update_project_name", when(mode="update_project_name")),
          ("decide_mode", "run_eligibility_check", when(mode="run_eligibility_check")),
          ("decide_mode", "upload_ifc_file", when(mode="upload_ifc_file")),
          ("decide_mode", "upload_structural_notes", when(mode="upload_structural_notes")),
          ("decide_mode", "unknown_intent", default),
          (
              [
                  "update_project_name",
                  "run_eligibility_check", 
                  "upload_ifc_file",
                  "upload_structural_notes",
                  "unknown_intent",
                  "unsafe_response",
              ],
              "prompt",
          ),
      )
      .build()
)

graph = create_burr_graph()

if __name__ == "__main__":
    print("Burr graph created successfully.")
    print(graph)
    # You can now use `graph` in your Burr application.