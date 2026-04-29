document.addEventListener("DOMContentLoaded", () => {

    const orbitData = [
        {
            ring: 1,
            radius: 140,
            speed: 25,
            reverse: false,
            items: ["JavaScript", "Python", "SQL", "HTML5", "CSS3"]
        },
        {
            ring: 2,
            radius: 230,
            speed: 35,
            reverse: true,
            items: ["React.js", "Django", "Tailwind CSS", "Bootstrap", "Vite"]
        },
        {
            ring: 3,
            radius: 320,
            speed: 45,
            reverse: false,
            items: ["PostgreSQL", "MongoDB"]
        },
        {
            ring: 4,
            radius: 420,
            speed: 60,
            reverse: true,
            items: ["Git", "REST APIs", "System Design", "Algorithms", "JWT Auth", "Postman", "Figma"]
        }
    ];

    const createQuantumSection = () => {
        const section = document.createElement("section");
        section.id = "custom-skills-revamp";
        section.className = "reveal in";

        let html = `
            <div class="quantum-header">
                <div class="section-num mb-4" style="font-family: 'JetBrains Mono', monospace; color: rgba(232,178,122,0.8); font-size: 0.75rem; letter-spacing: 0.2em;">// 03 — STACK</div>
                <h2>The tools I have <span class="highlight">mastered</span>.</h2>
            </div>
            <div class="quantum-container">
                <div class="quantum-core">CORE</div>
                <div class="orbit-system">
        `;

        orbitData.forEach(ring => {
            const numItems = ring.items.length;
            const reverseClass = ring.reverse ? 'reverse' : '';

            html += `<div class="orbit-ring ${reverseClass}" style="--ring-radius: ${ring.radius}; --speed: ${ring.speed}s;">`;

            ring.items.forEach((item, index) => {
                const angle = (360 / numItems) * index;
                html += `
                    <div class="satellite" style="--angle: ${angle}deg;">
                        <div class="satellite-wrapper">
                            <div class="satellite-content">${item}</div>
                        </div>
                    </div>
                `;
            });

            html += `</div>`;
        });

        html += `
                </div>
            </div>
        `;
        section.innerHTML = html;

        return section;
    };

    const injectSkills = () => {
        const oldSkills = document.getElementById("skills");
        if (oldSkills && !document.getElementById("custom-skills-revamp")) {
            oldSkills.parentNode.insertBefore(createQuantumSection(), oldSkills.nextSibling);
            return true;
        }
        return false;
    };

    // Attempt immediately
    if (!injectSkills()) {
        const observer = new MutationObserver((mutations) => {
            if (injectSkills()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
});
