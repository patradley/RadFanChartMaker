class GedcomParser {
    constructor() {
        this.individuals = new Map();
        this.families = new Map();
    }

    parse(gedcomText) {
        const lines = gedcomText.split('\n');
        let currentIndividual = null;
        let currentFamily = null;
        let currentContext = null;
        let currentEvent = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(' ');
            const level = parseInt(parts[0]);
            const tag = parts[1];
            const value = parts.slice(2).join(' ');

            if (level === 0) {
                // Save previous contexts
                if (currentIndividual) {
                    this.individuals.set(currentIndividual.id, currentIndividual);
                }
                if (currentFamily) {
                    this.families.set(currentFamily.id, currentFamily);
                }

                currentEvent = null;

                if (tag.startsWith('@') && tag.endsWith('@')) {
                    const id = tag.slice(1, -1);
                    if (value === 'INDI') {
                        currentIndividual = {
                            id: id,
                            name: '',
                            givenName: '',
                            surname: '',
                            sex: '',
                            birth: {},
                            death: {},
                            familyChild: [],
                            familySpouse: []
                        };
                        currentFamily = null;
                        currentContext = 'INDI';
                    } else if (value === 'FAM') {
                        currentFamily = {
                            id: id,
                            husband: null,
                            wife: null,
                            children: []
                        };
                        currentIndividual = null;
                        currentContext = 'FAM';
                    } else {
                        currentContext = null;
                    }
                }
            } else if (level === 1 && currentContext) {
                currentEvent = null;

                if (currentContext === 'INDI' && currentIndividual) {
                    switch (tag) {
                        case 'NAME':
                            currentIndividual.name = this.cleanName(value);
                            break;
                        case 'SEX':
                            currentIndividual.sex = value;
                            break;
                        case 'BIRT':
                            currentEvent = 'birth';
                            currentIndividual.birth = {};
                            break;
                        case 'DEAT':
                            currentEvent = 'death';
                            currentIndividual.death = {};
                            break;
                        case 'FAMC':
                            currentIndividual.familyChild.push(this.cleanId(value));
                            break;
                        case 'FAMS':
                            currentIndividual.familySpouse.push(this.cleanId(value));
                            break;
                    }
                } else if (currentContext === 'FAM' && currentFamily) {
                    switch (tag) {
                        case 'HUSB':
                            currentFamily.husband = this.cleanId(value);
                            break;
                        case 'WIFE':
                            currentFamily.wife = this.cleanId(value);
                            break;
                        case 'CHIL':
                            currentFamily.children.push(this.cleanId(value));
                            break;
                    }
                }
            } else if (level === 2 && currentEvent && currentIndividual) {
                const eventObj = currentEvent === 'birth' ? currentIndividual.birth : currentIndividual.death;
                
                if (tag === 'DATE') {
                    eventObj.date = value;
                    eventObj.year = this.extractYear(value);
                } else if (tag === 'PLAC') {
                    eventObj.place = value;
                    eventObj.country = this.extractCountry(value);
                }
            } else if (level === 2 && currentContext === 'INDI' && currentIndividual) {
                if (tag === 'GIVN') {
                    currentIndividual.givenName = value;
                } else if (tag === 'SURN') {
                    currentIndividual.surname = value;
                }
            }
        }

        // Save last individual/family
        if (currentIndividual) {
            this.individuals.set(currentIndividual.id, currentIndividual);
        }
        if (currentFamily) {
            this.families.set(currentFamily.id, currentFamily);
        }

        return {
            individuals: this.individuals,
            families: this.families
        };
    }

    cleanName(name) {
        return name.replace(/\//g, '').trim();
    }

    cleanId(id) {
        return id.replace(/@/g, '');
    }

    extractYear(dateString) {
        if (!dateString) return null;
        
        // Try to find a 4-digit year
        const yearMatch = dateString.match(/\b(1\d{3}|20\d{2})\b/);
        return yearMatch ? yearMatch[0] : null;
    }

    extractCountry(place) {
        if (!place) return null;

        // Split by comma and take the last part as country
        const parts = place.split(',').map(p => p.trim());
        if (parts.length > 0) {
            return parts[parts.length - 1];
        }

        return null;
    }

    getParents(individualId) {
        const individual = this.individuals.get(individualId);
        if (!individual || individual.familyChild.length === 0) {
            return { father: null, mother: null };
        }

        const familyId = individual.familyChild[0];
        const family = this.families.get(familyId);
        
        if (!family) {
            return { father: null, mother: null };
        }

        return {
            father: family.husband ? this.individuals.get(family.husband) : null,
            mother: family.wife ? this.individuals.get(family.wife) : null
        };
    }

    getChildren(individualId) {
        const individual = this.individuals.get(individualId);
        if (!individual || individual.familySpouse.length === 0) {
            return [];
        }

        const children = [];
        for (const familyId of individual.familySpouse) {
            const family = this.families.get(familyId);
            if (family && family.children) {
                for (const childId of family.children) {
                    const child = this.individuals.get(childId);
                    if (child) {
                        children.push(child);
                    }
                }
            }
        }

        return children;
    }

    getAncestors(individualId, generations) {
        const ancestors = [];
        const queue = [{ individual: this.individuals.get(individualId), generation: 0 }];

        while (queue.length > 0) {
            const { individual, generation } = queue.shift();
            
            if (!individual || generation >= generations) continue;

            ancestors.push({ individual, generation });

            const parents = this.getParents(individual.id);
            if (parents.father) {
                queue.push({ individual: parents.father, generation: generation + 1 });
            }
            if (parents.mother) {
                queue.push({ individual: parents.mother, generation: generation + 1 });
            }
        }

        return ancestors;
    }

    loadFromData(individuals, families) {
        this.individuals = new Map();
        this.families = new Map();
        for (const ind of individuals) {
            this.individuals.set(ind.id, ind);
        }
        for (const fam of families) {
            this.families.set(fam.id, fam);
        }
        return { individuals: this.individuals, families: this.families };
    }

    getAllIndividualsArray() {
        return Array.from(this.individuals.values()).sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
    }
}
