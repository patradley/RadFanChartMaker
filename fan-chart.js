class FanChart {
    constructor(svgElement, parser) {
        this.svg = svgElement;
        this.parser = parser;
        this.config = {
            centerX: 600,
            centerY: 600,
            innerRadius: 80,
            radiusIncrement: 100,
            fontSize: 10,
            fontFamily: 'Arial, sans-serif',
            showBirthYear: true,
            showDeathYear: true,
            showCountry: false,
            showDescendants: false,
            colorScheme: 'classic',
            fanAngle: 360
        };
        
        this.colorSchemes = {
            classic: {
                male: '#4A90E2',
                female: '#E85D75',
                unknown: '#95A5A6'
            },
            generation: [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
            ],
            monochrome: {
                male: '#34495E',
                female: '#7F8C8D',
                unknown: '#95A5A6'
            },
            pastel: {
                male: '#A8D8EA',
                female: '#FFCBCB',
                unknown: '#E8E8E8'
            },
            heritage: {
                male: '#B4623F',
                female: '#5A6B52',
                unknown: '#968C7B'
            },
            archival: [
                '#B4623F', '#6E7F63', '#C09B45', '#8A4630',
                '#4A5842', '#A9822F', '#C67C5B', '#746B5D'
            ]
        };

        this.flagPatterns = {};
        this.defs = null;

        // Country/state name to flagcdn.com code (case-insensitive lookup built at runtime)
        this.countryToFlag = {
            // European countries
            'albania': 'al', 'austria': 'at', 'belgium': 'be', 'bosnia and herzegovina': 'ba',
            'bulgaria': 'bg', 'croatia': 'hr', 'cyprus': 'cy', 'czech republic': 'cz',
            'czechia': 'cz', 'denmark': 'dk', 'estonia': 'ee', 'finland': 'fi',
            'france': 'fr', 'germany': 'de', 'deutschland': 'de', 'greece': 'gr',
            'hungary': 'hu', 'iceland': 'is', 'ireland': 'ie', 'italy': 'it',
            'italia': 'it', 'latvia': 'lv', 'lithuania': 'lt', 'luxembourg': 'lu',
            'malta': 'mt', 'moldova': 'md', 'montenegro': 'me', 'netherlands': 'nl',
            'holland': 'nl', 'north macedonia': 'mk', 'norway': 'no', 'poland': 'pl',
            'polska': 'pl', 'portugal': 'pt', 'romania': 'ro', 'russia': 'ru',
            'serbia': 'rs', 'slovakia': 'sk', 'slovenia': 'si', 'spain': 'es',
            'espana': 'es', 'españa': 'es', 'sweden': 'se', 'switzerland': 'ch',
            'ukraine': 'ua', 'united kingdom': 'gb', 'great britain': 'gb',
            'england': 'gb', 'scotland': 'gb', 'wales': 'gb', 'uk': 'gb',
            'belarus': 'by', 'bosnia': 'ba',

            // Non-European countries
            'united states': 'us', 'united states of america': 'us', 'usa': 'us', 'us': 'us',
            'canada': 'ca', 'mexico': 'mx', 'australia': 'au', 'new zealand': 'nz',
            'brazil': 'br', 'argentina': 'ar', 'chile': 'cl', 'colombia': 'co',
            'china': 'cn', 'japan': 'jp', 'south korea': 'kr', 'india': 'in',
            'south africa': 'za', 'israel': 'il', 'turkey': 'tr',

            // US states
            'alabama': 'us-al', 'alaska': 'us-ak', 'arizona': 'us-az', 'arkansas': 'us-ar',
            'california': 'us-ca', 'colorado': 'us-co', 'connecticut': 'us-ct', 'delaware': 'us-de',
            'florida': 'us-fl', 'georgia': 'us-ga', 'hawaii': 'us-hi', 'idaho': 'us-id',
            'illinois': 'us-il', 'indiana': 'us-in', 'iowa': 'us-ia', 'kansas': 'us-ks',
            'kentucky': 'us-ky', 'louisiana': 'us-la', 'maine': 'us-me', 'maryland': 'us-md',
            'massachusetts': 'us-ma', 'michigan': 'us-mi', 'minnesota': 'us-mn',
            'mississippi': 'us-ms', 'missouri': 'us-mo', 'montana': 'us-mt', 'nebraska': 'us-ne',
            'nevada': 'us-nv', 'new hampshire': 'us-nh', 'new jersey': 'us-nj',
            'new mexico': 'us-nm', 'new york': 'us-ny', 'north carolina': 'us-nc',
            'north dakota': 'us-nd', 'ohio': 'us-oh', 'oklahoma': 'us-ok', 'oregon': 'us-or',
            'pennsylvania': 'us-pa', 'rhode island': 'us-ri', 'south carolina': 'us-sc',
            'south dakota': 'us-sd', 'tennessee': 'us-tn', 'texas': 'us-tx', 'utah': 'us-ut',
            'vermont': 'us-vt', 'virginia': 'us-va', 'washington': 'us-wa',
            'west virginia': 'us-wv', 'wisconsin': 'us-wi', 'wyoming': 'us-wy',
            'district of columbia': 'us-dc', 'dc': 'us-dc'
        };
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    generate(centerPersonId, generations, spousePersonId = null) {
        // Clear the SVG
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        this.flagPatterns = {};
        this.defs = null;

        const centerPerson = this.parser.individuals.get(centerPersonId);
        if (!centerPerson) {
            console.error('Center person not found');
            return;
        }

        const spousePerson = spousePersonId ? this.parser.individuals.get(spousePersonId) : null;

        // Set SVG viewBox
        const size = 1200;
        this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
        this.svg.setAttribute('width', size);
        this.svg.setAttribute('height', size);

        // Get ancestors
        const ancestors = this.parser.getAncestors(centerPersonId, generations);

        // Draw ancestors fan chart
        this.drawAncestorsFan(ancestors, generations);

        // Draw center person (or couple, if a spouse is selected)
        this.drawCenterPerson(centerPerson, spousePerson);

        // Draw descendants if enabled
        if (this.config.showDescendants) {
            this.drawDescendantsFan(centerPerson, spousePerson, generations);
        }
    }

    drawAncestorsFan(ancestors, maxGenerations) {
        // Group ancestors by generation
        const byGeneration = new Array(maxGenerations).fill(null).map(() => []);

        for (const { individual, generation } of ancestors) {
            if (generation > 0 && generation < maxGenerations) {
                byGeneration[generation].push(individual);
            }
        }

        // Draw each generation
        for (let gen = 1; gen < maxGenerations; gen++) {
            const individuals = byGeneration[gen];
            if (individuals.length === 0) continue;

            const innerRadius = this.config.innerRadius + (gen - 1) * this.config.radiusIncrement;
            const outerRadius = innerRadius + this.config.radiusIncrement;

            // Calculate positions for this generation
            const positions = this.calculateAncestorPositions(gen, maxGenerations, this.config.fanAngle);

            individuals.forEach((individual, index) => {
                if (index < positions.length) {
                    this.drawPersonSegment(
                        individual,
                        positions[index].startAngle,
                        positions[index].endAngle,
                        innerRadius,
                        outerRadius,
                        gen
                    );
                }
            });
        }
    }

    calculateAncestorPositions(generation, maxGenerations, fanAngleDeg) {
        // Each generation doubles the number of positions
        const numPositions = Math.pow(2, generation);
        const fanAngleRad = (fanAngleDeg * Math.PI) / 180;
        const anglePerPerson = fanAngleRad / numPositions;

        // Center the fan at 12 o'clock (-PI/2)
        const startOffset = -Math.PI / 2 - fanAngleRad / 2;

        const positions = [];
        for (let i = 0; i < numPositions; i++) {
            const startAngle = startOffset + i * anglePerPerson;
            const endAngle = startOffset + (i + 1) * anglePerPerson;
            positions.push({ startAngle, endAngle });
        }

        return positions;
    }

    drawPersonSegment(person, startAngle, endAngle, innerRadius, outerRadius, generation) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.classList.add('person-segment');
        
        // Draw the segment path
        const path = this.createSegmentPath(startAngle, endAngle, innerRadius, outerRadius);
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', path);
        pathElement.setAttribute('fill', this.getColor(person, generation));
        pathElement.setAttribute('stroke', 'white');
        pathElement.setAttribute('stroke-width', '2');
        
        // Add click handler
        pathElement.addEventListener('click', () => this.onPersonClick(person));
        
        group.appendChild(pathElement);

        // Add text
        const textElement = this.createPersonText(person, startAngle, endAngle, innerRadius, outerRadius);
        if (textElement) {
            group.appendChild(textElement);
        }

        this.svg.appendChild(group);
    }

    createSegmentPath(startAngle, endAngle, innerRadius, outerRadius) {
        const x1 = this.config.centerX + innerRadius * Math.cos(startAngle);
        const y1 = this.config.centerY + innerRadius * Math.sin(startAngle);
        const x2 = this.config.centerX + outerRadius * Math.cos(startAngle);
        const y2 = this.config.centerY + outerRadius * Math.sin(startAngle);
        const x3 = this.config.centerX + outerRadius * Math.cos(endAngle);
        const y3 = this.config.centerY + outerRadius * Math.sin(endAngle);
        const x4 = this.config.centerX + innerRadius * Math.cos(endAngle);
        const y4 = this.config.centerY + innerRadius * Math.sin(endAngle);

        const largeArc = (endAngle - startAngle) > Math.PI ? 1 : 0;

        return `
            M ${x1} ${y1}
            L ${x2} ${y2}
            A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}
            L ${x4} ${y4}
            A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
            Z
        `;
    }

    createPersonText(person, startAngle, endAngle, innerRadius, outerRadius) {
        const midAngle = (startAngle + endAngle) / 2;
        const midRadius = (innerRadius + outerRadius) / 2;
        
        const x = this.config.centerX + midRadius * Math.cos(midAngle);
        const y = this.config.centerY + midRadius * Math.sin(midAngle);

        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.classList.add('person-text');
        textElement.setAttribute('x', x);
        textElement.setAttribute('y', y);
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        textElement.setAttribute('font-size', this.config.fontSize);
        textElement.setAttribute('font-family', this.config.fontFamily);
        textElement.setAttribute('fill', 'white');
        textElement.setAttribute('font-weight', 'bold');

        // Calculate rotation to align with segment
        let rotation = (midAngle * 180 / Math.PI) + 90;
        if (rotation > 90 && rotation < 270) {
            rotation += 180;
        }
        textElement.setAttribute('transform', `rotate(${rotation} ${x} ${y})`);

        // Build text content
        let lines = [];
        
        // Name
        const name = this.shortenName(person.name);
        if (name) lines.push(name);

        // Years
        let yearLine = '';
        if (this.config.showBirthYear && person.birth.year) {
            yearLine += person.birth.year;
        }
        if (this.config.showDeathYear && person.death.year) {
            yearLine += (yearLine ? '-' : 'd.') + person.death.year;
        }
        if (yearLine) lines.push(yearLine);

        // Country
        if (this.config.showCountry) {
            const country = person.birth.country || person.death.country;
            if (country) lines.push(country);
        }

        // Add tspan elements for multi-line text
        if (lines.length === 0) return null;

        lines.forEach((line, index) => {
            const tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            tspan.textContent = line;
            tspan.setAttribute('x', x);
            tspan.setAttribute('dy', index === 0 ? 0 : this.config.fontSize * 1.2);
            textElement.appendChild(tspan);
        });

        return textElement;
    }

    drawCenterPerson(person, spouse) {
        if (spouse) {
            this.drawCoupleCenter(person, spouse);
            return;
        }

        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', this.config.centerX);
        circle.setAttribute('cy', this.config.centerY);
        circle.setAttribute('r', this.config.innerRadius);
        circle.setAttribute('fill', this.getColor(person, 0));
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '4');
        circle.style.cursor = 'pointer';
        circle.addEventListener('click', () => this.onPersonClick(person));
        
        this.svg.appendChild(circle);

        // Add text
        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', this.config.centerX);
        textElement.setAttribute('y', this.config.centerY);
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        textElement.setAttribute('font-size', this.config.fontSize * 1.5);
        textElement.setAttribute('font-family', this.config.fontFamily);
        textElement.setAttribute('fill', 'white');
        textElement.setAttribute('font-weight', 'bold');
        textElement.classList.add('person-text');

        const name = person.name || 'Unknown';
        const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan1.textContent = name;
        tspan1.setAttribute('x', this.config.centerX);
        textElement.appendChild(tspan1);

        if (person.birth.year || person.death.year) {
            const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            let years = '';
            if (person.birth.year) years += person.birth.year;
            if (person.death.year) years += '-' + person.death.year;
            tspan2.textContent = years;
            tspan2.setAttribute('x', this.config.centerX);
            tspan2.setAttribute('dy', this.config.fontSize * 2);
            textElement.appendChild(tspan2);
        }

        this.svg.appendChild(textElement);
    }

    drawCoupleCenter(person, spouse) {
        // Split the center circle in half: person on the left, spouse on the right
        this.drawCenterHalf(person, Math.PI / 2, 3 * Math.PI / 2, -1);
        this.drawCenterHalf(spouse, -Math.PI / 2, Math.PI / 2, 1);
    }

    drawCenterHalf(person, startAngle, endAngle, side) {
        const path = this.createSegmentPath(startAngle, endAngle, 0, this.config.innerRadius);
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathElement.setAttribute('d', path);
        pathElement.setAttribute('fill', this.getColor(person, 0));
        pathElement.setAttribute('stroke', 'white');
        pathElement.setAttribute('stroke-width', '4');
        pathElement.style.cursor = 'pointer';
        pathElement.addEventListener('click', () => this.onPersonClick(person));
        this.svg.appendChild(pathElement);

        const textX = this.config.centerX + side * this.config.innerRadius * 0.5;

        const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        textElement.setAttribute('x', textX);
        textElement.setAttribute('y', this.config.centerY);
        textElement.setAttribute('text-anchor', 'middle');
        textElement.setAttribute('dominant-baseline', 'middle');
        textElement.setAttribute('font-size', this.config.fontSize * 1.1);
        textElement.setAttribute('font-family', this.config.fontFamily);
        textElement.setAttribute('fill', 'white');
        textElement.setAttribute('font-weight', 'bold');
        textElement.classList.add('person-text');

        const name = this.shortenName(person.name) || 'Unknown';
        const tspan1 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
        tspan1.textContent = name;
        tspan1.setAttribute('x', textX);
        textElement.appendChild(tspan1);

        if (person.birth.year || person.death.year) {
            const tspan2 = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
            let years = '';
            if (person.birth.year) years += person.birth.year;
            if (person.death.year) years += '-' + person.death.year;
            tspan2.textContent = years;
            tspan2.setAttribute('x', textX);
            tspan2.setAttribute('dy', this.config.fontSize * 1.4);
            textElement.appendChild(tspan2);
        }

        this.svg.appendChild(textElement);
    }

    drawDescendantsFan(centerPerson, spouse, generations) {
        const children = spouse
            ? this.parser.getChildrenOfCouple(centerPerson.id, spouse.id)
            : this.parser.getChildren(centerPerson.id);
        if (children.length === 0) return;

        // Sit just outside the deepest ancestor ring so descendants never overlap ancestors
        const ancestorRings = Math.max(generations - 1, 0);
        const innerRadius = this.config.innerRadius + ancestorRings * this.config.radiusIncrement;
        const outerRadius = innerRadius + this.config.radiusIncrement;
        const anglePerChild = (2 * Math.PI) / children.length;

        children.forEach((child, index) => {
            const startAngle = index * anglePerChild + Math.PI / 2;
            const endAngle = (index + 1) * anglePerChild + Math.PI / 2;

            this.drawPersonSegment(child, startAngle, endAngle, innerRadius, outerRadius, -1);
        });
    }

    getCountryCode(person) {
        const country = person.birth.country || person.death.country;
        if (!country) return null;
        const key = country.toLowerCase().trim();
        return this.countryToFlag[key] || null;
    }

    ensureFlagPattern(countryCode) {
        if (this.flagPatterns[countryCode]) return;

        if (!this.defs) {
            this.defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svg.insertBefore(this.defs, this.svg.firstChild);
        }

        const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
        pattern.setAttribute('id', 'flag-' + countryCode);
        pattern.setAttribute('patternContentUnits', 'objectBoundingBox');
        pattern.setAttribute('width', '1');
        pattern.setAttribute('height', '1');

        const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
        image.setAttribute('href', 'https://flagcdn.com/' + countryCode + '.svg');
        image.setAttribute('width', '1');
        image.setAttribute('height', '1');
        image.setAttribute('preserveAspectRatio', 'xMidYMid slice');

        pattern.appendChild(image);
        this.defs.appendChild(pattern);
        this.flagPatterns[countryCode] = true;
    }

    getColor(person, generation) {
        const scheme = this.config.colorScheme;

        if (scheme === 'flags') {
            const code = this.getCountryCode(person);
            if (code) {
                this.ensureFlagPattern(code);
                return 'url(#flag-' + code + ')';
            }
            return '#95A5A6';
        } else if (Array.isArray(this.colorSchemes[scheme])) {
            const colors = this.colorSchemes[scheme];
            const colorIndex = Math.abs(generation) % colors.length;
            return colors[colorIndex];
        } else {
            const colors = this.colorSchemes[scheme] || this.colorSchemes.classic;
            if (person.sex === 'M') return colors.male;
            if (person.sex === 'F') return colors.female;
            return colors.unknown;
        }
    }

    shortenName(name) {
        if (!name) return '';
        
        const parts = name.split(' ');
        if (parts.length > 2) {
            return parts[0] + ' ' + parts[parts.length - 1];
        }
        
        return name;
    }


    onPersonClick(person) {
        const event = new CustomEvent('personSelected', { 
            detail: person 
        });
        this.svg.dispatchEvent(event);
    }

    exportSVG() {
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(this.svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'ancestry-fan-chart.svg';
        link.click();
        
        URL.revokeObjectURL(url);
    }
}
