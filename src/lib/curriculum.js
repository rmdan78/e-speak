
export const curriculum = {
    interview: {
        name: "Job Interviews",
        description: "Practice job interview scenarios with HR",
        topics: [
            {
                id: "behavioral_interview",
                name: "Behavioral Interview",
                description: "Answer 'Tell me about a time...' questions",
                scenario: "You're in a job interview. The HR manager will ask behavioral questions using the STAR method.",
                role: "HR Manager",
                roleName: "Sarah",
                vocabulary: ["accomplishment", "challenge", "initiative", "collaborate", "prioritize", "exceed expectations", "stakeholder", "deadline", "deliverable", "outcome"],
                phrases: ["Tell me about a time when...", "Walk me through...", "How did you handle...", "What was the result?", "What would you do differently?"]
            },
            {
                id: "technical_interview",
                name: "Technical Discussion",
                description: "Explain your expertise and problem-solving approach",
                scenario: "The interviewer wants to understand your technical skills and how you approach complex problems.",
                role: "Technical Lead",
                roleName: "David",
                vocabulary: ["methodology", "framework", "scalable", "optimize", "architecture", "best practices", "constraints", "trade-offs", "implementation", "integration"],
                phrases: ["Can you explain...", "What's your approach to...", "How would you solve...", "What technologies...", "Walk me through your thought process..."]
            },
            {
                id: "salary_negotiation",
                name: "Salary Negotiation",
                description: "Negotiate your compensation package professionally",
                scenario: "You've received a job offer and need to negotiate salary and benefits.",
                role: "Hiring Manager",
                roleName: "Michael",
                vocabulary: ["compensation", "benefits package", "equity", "signing bonus", "performance review", "counter-offer", "market rate", "total compensation", "flexibility", "growth potential"],
                phrases: ["Based on my research...", "I was expecting...", "What flexibility is there...", "Can we discuss...", "I'd like to understand..."]
            }
        ]
    },
    meetings: {
        name: "Business Meetings",
        description: "Lead and participate in professional meetings",
        topics: [
            {
                id: "project_kickoff",
                name: "Project Kickoff",
                description: "Start a new project and align stakeholders",
                scenario: "You're leading a kickoff meeting for a new project with cross-functional team members.",
                role: "Project Stakeholder",
                roleName: "Jennifer",
                vocabulary: ["milestone", "timeline", "scope", "resource allocation", "dependencies", "risk mitigation", "alignment", "accountability", "cadence", "cross-functional"],
                phrases: ["Let's align on...", "What are the key deliverables...", "Who owns...", "What's our timeline...", "Are there any blockers..."]
            },
            {
                id: "status_update",
                name: "Status Update Meeting",
                description: "Provide clear project updates and address concerns",
                scenario: "You need to update senior leadership on project progress, issues, and next steps.",
                role: "Senior Director",
                roleName: "Robert",
                vocabulary: ["on track", "at risk", "mitigation plan", "blocker", "escalation", "bandwidth", "pivot", "reprioritize", "runway", "burn rate"],
                phrases: ["The current status is...", "We're facing a challenge with...", "Our recommendation is...", "We need a decision on...", "The next steps are..."]
            },
            {
                id: "brainstorming",
                name: "Brainstorming Session",
                description: "Generate and evaluate ideas collaboratively",
                scenario: "Your team needs to come up with creative solutions to a business challenge.",
                role: "Innovation Lead",
                roleName: "Alex",
                vocabulary: ["ideation", "iterate", "prototype", "feasibility", "value proposition", "differentiator", "synergy", "leverage", "paradigm", "disruption"],
                phrases: ["What if we...", "Building on that idea...", "Let's explore...", "The benefit would be...", "How might we..."]
            }
        ]
    },
    debates: {
        name: "Professional Debates",
        description: "Argue positions and defend your views",
        topics: [
            {
                id: "strategy_debate",
                name: "Strategic Direction",
                description: "Debate business strategy and direction",
                scenario: "You're in a leadership meeting debating whether to expand into a new market.",
                role: "VP of Strategy",
                roleName: "Victoria",
                vocabulary: ["market penetration", "competitive advantage", "first-mover", "market share", "ROI", "capital expenditure", "due diligence", "synergies", "acquisition", "organic growth"],
                phrases: ["I would argue that...", "The data suggests...", "However, we must consider...", "The risk is...", "My recommendation would be..."]
            },
            {
                id: "policy_discussion",
                name: "Policy Discussion",
                description: "Discuss and debate workplace policies",
                scenario: "The team is debating new remote work policies and their impact.",
                role: "HR Director",
                roleName: "Patricia",
                vocabulary: ["hybrid model", "productivity metrics", "work-life balance", "engagement", "retention", "burnout", "autonomy", "collaboration", "accountability", "flexibility"],
                phrases: ["From my perspective...", "The research shows...", "We need to balance...", "The concern is...", "A middle ground would be..."]
            },
            {
                id: "tech_debate",
                name: "Technology Decisions",
                description: "Debate technical approaches and solutions",
                scenario: "The engineering team is debating whether to build in-house or use a third-party solution.",
                role: "CTO",
                roleName: "Thomas",
                vocabulary: ["vendor lock-in", "total cost of ownership", "technical debt", "maintainability", "security implications", "compliance", "SLA", "uptime", "redundancy", "fault tolerance"],
                phrases: ["The trade-off here is...", "From a technical standpoint...", "The long-term impact...", "We should consider...", "My concern is..."]
            }
        ]
    },
    networking: {
        name: "Professional Networking",
        description: "Build connections at events and conferences",
        topics: [
            {
                id: "conference_networking",
                name: "Conference Small Talk",
                description: "Make connections at industry events",
                scenario: "You're at a tech conference and want to network with industry professionals.",
                role: "Industry Executive",
                roleName: "Catherine",
                vocabulary: ["industry trends", "thought leadership", "disruptive", "innovation", "ecosystem", "value chain", "emerging markets", "digital transformation", "sustainability", "scalability"],
                phrases: ["What brings you to...", "I've been following your work on...", "What's your take on...", "How is your company approaching...", "It would be great to connect..."]
            },
            {
                id: "linkedin_conversation",
                name: "Virtual Networking",
                description: "Build professional relationships online",
                scenario: "You're connecting with a potential mentor or collaborator via LinkedIn.",
                role: "Industry Leader",
                roleName: "Daniel",
                vocabulary: ["synergy", "collaboration", "mutual benefit", "expertise", "insights", "perspective", "opportunity", "partnership", "advisory", "mentorship"],
                phrases: ["I came across your profile...", "I'm impressed by...", "I'd love to learn more about...", "Would you be open to...", "I believe we could..."]
            }
        ]
    }
};

export const getTopicById = (topicId) => {
    for (const category of Object.values(curriculum)) {
        const topic = category.topics.find(t => t.id === topicId);
        if (topic) return { ...topic, category: category.name };
    }
    return null;
};

export const getAllTopics = () => {
    const topics = [];
    for (const [key, category] of Object.entries(curriculum)) {
        for (const topic of category.topics) {
            topics.push({ ...topic, categoryKey: key, categoryName: category.name });
        }
    }
    return topics;
};
