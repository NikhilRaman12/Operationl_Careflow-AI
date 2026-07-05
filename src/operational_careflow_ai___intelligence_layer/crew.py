import os


from crewai import LLM
from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai_tools import (
	FileReadTool
)
from operational_careflow_ai___intelligence_layer.tools.google_covid_epidemiology_tool import GoogleCovidEpidemiologyTool
from operational_careflow_ai___intelligence_layer.tools.google_covid_hospitalizations_tool import GoogleCovidHospitalizationsTool





@CrewBase
class OperationalCareflowAiIntelligenceLayerCrew:
    """OperationalCareflowAiIntelligenceLayer crew"""

    
    @agent
    def hospital_data_ingestion_validation_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["hospital_data_ingestion_validation_specialist"],
            
            
            tools=[				FileReadTool()],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def gpu_accelerated_hospital_operations_analytics_engineer(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["gpu_accelerated_hospital_operations_analytics_engineer"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def clinical_operations_patient_risk_scoring_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["clinical_operations_patient_risk_scoring_specialist"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def hospital_resource_demand_forecasting_analyst(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["hospital_resource_demand_forecasting_analyst"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def hospital_operational_resource_allocation_strategist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["hospital_operational_resource_allocation_strategist"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def gemini_powered_hospital_decision_intelligence_communicator(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["gemini_powered_hospital_decision_intelligence_communicator"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def hospital_operations_executive_report_compiler(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["hospital_operations_executive_report_compiler"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def careflow_ai_supervisor_orchestration_controller(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["careflow_ai_supervisor_orchestration_controller"],
            
            
            tools=[],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    
    @agent
    def google_covid_live_data_fetching_specialist(self) -> Agent:
        
        
        return Agent(
            config=self.agents_config["google_covid_live_data_fetching_specialist"],
            
            
            tools=[				GoogleCovidEpidemiologyTool(),
				GoogleCovidHospitalizationsTool()],
            
            reasoning=False,
            max_reasoning_attempts=None,
            inject_date=True,
            allow_delegation=False,
            max_iter=25,
            max_rpm=None,
            
            
            max_execution_time=None,
            llm=LLM(
                model="openai/gpt-4o-mini",
                
                
            ),
            
        )
        
    

    
    @task
    def fetch_live_google_covid_epidemiology_and_hospitalization_data(self) -> Task:
        return Task(
            config=self.tasks_config["fetch_live_google_covid_epidemiology_and_hospitalization_data"],
            markdown=False,
            
            
        )
    
    @task
    def ingest_and_validate_hospital_covid_operational_data(self) -> Task:
        return Task(
            config=self.tasks_config["ingest_and_validate_hospital_covid_operational_data"],
            markdown=False,
            
            
        )
    
    @task
    def gpu_accelerated_hospital_operations_analytics_and_eda(self) -> Task:
        return Task(
            config=self.tasks_config["gpu_accelerated_hospital_operations_analytics_and_eda"],
            markdown=False,
            
            
        )
    
    @task
    def patient_risk_scoring_and_severity_classification(self) -> Task:
        return Task(
            config=self.tasks_config["patient_risk_scoring_and_severity_classification"],
            markdown=False,
            
            
        )
    
    @task
    def near_term_hospital_resource_demand_forecasting(self) -> Task:
        return Task(
            config=self.tasks_config["near_term_hospital_resource_demand_forecasting"],
            markdown=False,
            
            
        )
    
    @task
    def operational_resource_allocation_recommendations(self) -> Task:
        return Task(
            config=self.tasks_config["operational_resource_allocation_recommendations"],
            markdown=False,
            
            
        )
    
    @task
    def gemini_decision_intelligence_briefing_for_hospital_administrators(self) -> Task:
        return Task(
            config=self.tasks_config["gemini_decision_intelligence_briefing_for_hospital_administrators"],
            markdown=False,
            
            
        )
    
    @task
    def executive_operations_report_compilation(self) -> Task:
        return Task(
            config=self.tasks_config["executive_operations_report_compilation"],
            markdown=False,
            
            
        )
    
    @task
    def careflow_ai_pipeline_supervision_and_final_decision_summary(self) -> Task:
        return Task(
            config=self.tasks_config["careflow_ai_pipeline_supervision_and_final_decision_summary"],
            markdown=False,
            
            
        )
    

    @crew
    def crew(self) -> Crew:
        """Creates the OperationalCareflowAiIntelligenceLayer crew"""

        return Crew(
            agents=self.agents,  # Automatically created by the @agent decorator
            tasks=self.tasks,  # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,

            chat_llm=LLM(model="openai/gpt-4o-mini"),
        )


