# NexusFlow --- Hackathon Project Brief

## 1. Project Overview

**Project name:** NexusFlow\
**Hackathon:** Nebius x NVIDIA Global AI Hackathon\
**Selected track:** Best Apps and Agents\
**Project category:** AI / Machine Learning / Agentic Applications

### One-line summary

NexusFlow is a real-time supply-chain intelligence platform that uses
AI-powered event normalization, retrieval-augmented generation (RAG),
historical event context, and supply-chain relationship mapping to
explain how global disruptions may propagate through products,
commodities, and industries.

### Core objective

NexusFlow turns scattered, continuously arriving reports about global
events into structured, evidence-grounded supply-chain intelligence.

Potential inputs include: - Global and business news - Geopolitical
developments - Shipping and logistics disruptions - Commodity and
industrial supply interruptions - Severe weather events - Factory, port,
and infrastructure incidents

The system aims to explain: - What happened and which entities are
involved - Which products, commodities, suppliers, or industries may be
affected - How a disruption could propagate through a supply chain -
Which historical events provide useful context - Which conclusions are
supported by evidence and which remain uncertain

**Scope for this hackathon:** Focus on the working real-time pipeline:
ingestion, normalization, RAG/historical retrieval, and supply-chain
impact analysis. Stock analysis and stock-price prediction are
intentionally out of scope for this prototype.

NexusFlow should explain plausible downstream effects rather than claim
deterministic predictions or unsupported causality.

## 2. Selected Track: Best Apps and Agents

This is the intended track because NexusFlow is a practical AI
application designed to solve a concrete business-intelligence problem.
It processes incoming information, retrieves relevant context, reasons
over evidence, and presents useful results through an application
interface.

The project is **not** being submitted as Personal AI. It is not
primarily a private personal assistant or a personalized memory
companion.

### What the demo should demonstrate

A clear end-to-end user journey:

1.  A new report or event enters the system.
2.  The pipeline cleans, normalizes, deduplicates, and groups related
    information.
3.  The RAG pipeline retrieves relevant historical events and supporting
    context.
4.  NVIDIA Nemotron, accessed through Nebius Token Factory, helps
    interpret the current event and retrieved evidence.
5.  The backend produces structured supply-chain impact analysis,
    including affected entities, potential impact paths, evidence,
    historical parallels, and uncertainty.
6.  The dashboard displays the result with source references and update
    timestamps.

The demo should show a real working flow, not only static mock-ups.

## 3. Required Nebius and NVIDIA Integration

The hackathon requires the project to run on **Nebius Token Factory or
Nebius AI Cloud** and use at least one **NVIDIA open-source model**.

### Planned integration

-   **Nebius Token Factory:** Hosted inference endpoint for the selected
    NVIDIA model.
-   **NVIDIA Nemotron:** Core language-model capability for structured
    event understanding and evidence-grounded supply-chain impact
    reasoning.
-   **Existing backend and data pipeline:** Retained where practical;
    model integration should support the existing workflow rather than
    require an unnecessary rewrite.
-   **Existing RAG/vector database:** Retained if functional and
    appropriate. Retrieve relevant context before asking the model to
    analyze an event.
-   **Existing frontend/dashboard:** Reused or adapted to present the
    end-to-end workflow.

### Intended uses of Nemotron

1.  **Semantic normalization:** Extract a consistent event
    representation from varied news reports, including event type,
    entities, location, time, and potential supply-chain relevance.
2.  **RAG-grounded historical comparison:** Compare a current event with
    retrieved historical events, clearly describing similarities,
    differences, and evidence limitations.
3.  **Supply-chain impact reasoning:** Generate structured, qualified
    explanations of plausible downstream effects using retrieved
    evidence and known relationships.

Use ordinary deterministic code for tasks such as timestamp formatting,
basic field cleanup, deduplication, validation, and graph construction
where appropriate. Model calls should be targeted rather than made for
every incoming article.

### Output quality and evidence

The system should: - Distinguish verified source facts from
model-generated hypotheses. - Preserve source links and timestamps where
available. - Avoid inventing sources, historical events, or
correlations. - Clearly state uncertainty and missing evidence. -
Validate model outputs before storing or rendering them. - Avoid
presenting a plausible impact chain as a confirmed real-world outcome
without evidence.

The exact model ID should be selected from the currently available
Nebius Token Factory catalogue. API keys must be stored as environment
variables or secrets and must never be committed to the public
repository.

## 4. Functional Scope

### In scope for the hackathon prototype

-   Live or near-real-time news/event ingestion
-   Event normalization and deduplication
-   Grouping or clustering reports that concern the same event
-   Embeddings and vector retrieval, using the existing pipeline where
    possible
-   RAG over relevant historical events and supporting material
-   NVIDIA Nemotron inference through Nebius
-   Supply-chain entity and relationship mapping
-   Evidence-backed impact explanations
-   Dashboard display of events, evidence, historical parallels, and
    potential impact paths
-   Update timestamps, error handling, and clear uncertainty labels

### Explicitly out of scope for this prototype

-   Stock-price analysis and stock prediction
-   A claim to predict market movements with certainty
-   Completing every feature in the long-term platform vision
-   Unnecessary multi-agent complexity or extra infrastructure that does
    not improve the demonstration

The prototype should prioritize one reliable end-to-end workflow over
many incomplete features.

## 5. Relationship to the Existing Project

ImpactChain AI is the existing, longer-term project vision for broader
global economic and market-impact intelligence. **NexusFlow will reuse
its existing backend/codebase where suitable**, focusing the hackathon
submission on real-time supply-chain intelligence, normalization, and
RAG while leaving stock analysis out of scope.

## 6. Architecture at a High Level

**Event sources → ingestion → normalization and deduplication → event
clustering → embeddings/vector retrieval → historical context (RAG) →
Nemotron via Nebius Token Factory → validated supply-chain impact
representation → dashboard**

The exact modules, frameworks, data stores, and implementation details
should follow what is already present and functional in the codebase.
Avoid replacing working components without a clear reason.

## 7. Hackathon Requirements and Submission Checklist

The following requirements are taken from the hackathon information
provided for this brief. Check the official rules and dashboard again
before submitting in case any details change.

-   [ ] Select **Best Apps and Agents** as the project track.
-   [ ] Run the project on Nebius Token Factory or Nebius AI Cloud.
-   [ ] Use at least one NVIDIA open-source model; document the exact
    model and where it is used.
-   [ ] Provide a working project and a URL to a working demo, hosted
    application, or test build.
-   [ ] Provide a public GitHub, GitLab, or Bitbucket repository.
-   [ ] Include an open-source license visible near the top of the
    repository page, such as MIT, Apache-2.0, or MPL-2.0.
-   [ ] Include a README with setup instructions and clear instructions
    for running the project.
-   [ ] Explain how NVIDIA Nemotron or another eligible NVIDIA
    open-source model is used.
-   [ ] Explain how Nebius Token Factory or Nebius AI Cloud is used, and
    identify any other Nebius/NVIDIA services used.
-   [ ] Provide feedback on Nebius and NVIDIA tools/services used, as
    requested by the hackathon.
-   [ ] Submit a public YouTube demo video no longer than three minutes
    showing the project working and demonstrating the Nebius/NVIDIA
    integration.
-   [ ] If the project existed before the submission period, include an
    honest explanation of the significant updates made during the
    submission period.
-   [ ] If applicable, select the city attended for the Builders & Brews
    City Winner Award.

### Deadline shown on the supplied Devpost page

**October 30, 2026, at 10:30 PM India Standard Time (IST).**

Verify the live Devpost page for any schedule or rules updates before
submission.

## 8. Judging Criteria

The hackathon describes four major judging dimensions:

### Technological implementation

How effectively the working system uses Nebius infrastructure and the
required NVIDIA open-source model.

### Design

Whether the submission feels like a coherent, usable product rather than
a disconnected proof of concept.

### Potential impact

Whether NexusFlow addresses a real supply-chain intelligence problem and
demonstrates a credible solution for a defined audience.

### Quality of the idea

Whether the approach is thoughtful, creative, and shows a genuine
understanding of the problem and the selected technologies.

## 9. Demo Narrative

A concise demo can follow this sequence:

1.  Show a newly ingested real-world event and its source.
2.  Show how the system normalizes the event and groups related reports.
3.  Show retrieved historical context and explain why it is relevant.
4.  Show the Nemotron analysis executed through Nebius Token Factory.
5.  Show the resulting supply-chain impact path and evidence in the
    dashboard.
6.  Highlight uncertainty and distinguish sourced facts from inferred
    possibilities.

Use a real example that the prototype can process reliably. Do not
present sample or simulated data as live data.

## 10. Definition of a Successful Prototype

NexusFlow is ready for submission when a judge can follow at least one
complete event from ingestion through normalization, RAG retrieval,
Nemotron analysis via Nebius, and a useful evidence-backed supply-chain
impact view in the application.

A smaller, stable, verifiable workflow is preferable to a larger system
whose key components cannot be demonstrated.
