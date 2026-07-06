// Main Application
let parser = null;
let fanChart = null;
let currentCenterPersonId = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
});

function initializeEventListeners() {
    // File upload
    const fileInput = document.getElementById('gedcom-file');
    fileInput.addEventListener('change', handleFileUpload);

    // Settings
    document.getElementById('generations').addEventListener('input', (e) => {
        document.getElementById('generations-value').textContent = e.target.value;
    });

    document.getElementById('fan-angle').addEventListener('input', (e) => {
        document.getElementById('fan-angle-value').textContent = e.target.value + '°';
    });

    document.getElementById('font-size').addEventListener('input', (e) => {
        document.getElementById('font-size-value').textContent = e.target.value + 'px';
    });

    // Generate chart button
    document.getElementById('generate-chart').addEventListener('click', generateChart);

    // Download SVG button
    document.getElementById('download-svg').addEventListener('click', () => {
        if (fanChart) {
            fanChart.exportSVG();
        }
    });

    // Center person selection
    document.getElementById('center-person').addEventListener('change', (e) => {
        currentCenterPersonId = e.target.value;
    });

    // Save chart button
    document.getElementById('save-chart').addEventListener('click', saveChart);

    // Edit data button
    document.getElementById('edit-data').addEventListener('click', openDataEditor);
    document.getElementById('close-editor').addEventListener('click', closeDataEditor);
    document.getElementById('editor-cancel').addEventListener('click', closeDataEditor);
    document.getElementById('editor-apply').addEventListener('click', applyDataEdits);

    // Load chart file
    document.getElementById('load-chart-file').addEventListener('change', handleLoadChart);

    // Person details close button
    document.getElementById('close-details').addEventListener('click', () => {
        document.getElementById('person-details').classList.add('hidden');
    });

    // Listen for person selection in the chart
    const svg = document.getElementById('fan-chart');
    svg.addEventListener('personSelected', (e) => {
        showPersonDetails(e.detail);
    });
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('file-name').textContent = file.name;

    const reader = new FileReader();
    reader.onload = (e) => {
        const gedcomText = e.target.result;
        parseGedcom(gedcomText);
    };
    reader.readAsText(file);
}

function parseGedcom(gedcomText) {
    try {
        parser = new GedcomParser();
        const result = parser.parse(gedcomText);

        console.log(`Parsed ${result.individuals.size} individuals and ${result.families.size} families`);

        populateCenterPersonDropdown();
        
        document.getElementById('generate-chart').disabled = false;
        document.getElementById('edit-data').disabled = false;

        // Auto-select first person
        const select = document.getElementById('center-person');
        if (select.options.length > 1) {
            select.selectedIndex = 1;
            currentCenterPersonId = select.value;
        }

        showNotification('GEDCOM file loaded successfully!', 'success');
    } catch (error) {
        console.error('Error parsing GEDCOM:', error);
        showNotification('Error parsing GEDCOM file. Please check the file format.', 'error');
    }
}

function populateCenterPersonDropdown() {
    const select = document.getElementById('center-person');
    select.innerHTML = '<option value="">Select a person...</option>';

    const individuals = parser.getAllIndividualsArray();

    individuals.forEach(person => {
        const option = document.createElement('option');
        option.value = person.id;
        
        let label = person.name || 'Unknown';
        if (person.birth.year) {
            label += ` (b. ${person.birth.year})`;
        }
        
        option.textContent = label;
        select.appendChild(option);
    });
}

function generateChart() {
    if (!parser || !currentCenterPersonId) {
        showNotification('Please select a center person', 'error');
        return;
    }

    const generations = parseInt(document.getElementById('generations').value);
    const fanAngle = parseInt(document.getElementById('fan-angle').value);
    const fontSize = parseInt(document.getElementById('font-size').value);
    const fontFamily = document.getElementById('font-family').value;
    const showBirthYear = document.getElementById('show-birth-year').checked;
    const showDeathYear = document.getElementById('show-death-year').checked;
    const showCountry = document.getElementById('show-country').checked;
    const showDescendants = document.getElementById('show-descendants').checked;
    const colorScheme = document.getElementById('color-scheme').value;

    const svg = document.getElementById('fan-chart');
    
    if (!fanChart) {
        fanChart = new FanChart(svg, parser);
    }

    fanChart.updateConfig({
        fanAngle,
        fontSize,
        fontFamily,
        showBirthYear,
        showDeathYear,
        showCountry,
        showDescendants,
        colorScheme
    });

    fanChart.generate(currentCenterPersonId, generations);

    document.getElementById('download-svg').disabled = false;
    document.getElementById('save-chart').disabled = false;

    showNotification('Chart generated successfully!', 'success');
}

function showPersonDetails(person) {
    const detailsPanel = document.getElementById('person-details');
    const detailsContent = detailsPanel.querySelector('.details-content');

    detailsContent.innerHTML = '';

    // Name
    addDetailItem(detailsContent, 'Full Name', person.name || 'Unknown');

    // Given Name
    if (person.givenName) {
        addDetailItem(detailsContent, 'Given Name', person.givenName);
    }

    // Surname
    if (person.surname) {
        addDetailItem(detailsContent, 'Surname', person.surname);
    }

    // Sex
    if (person.sex) {
        const sexLabel = person.sex === 'M' ? 'Male' : person.sex === 'F' ? 'Female' : 'Unknown';
        addDetailItem(detailsContent, 'Sex', sexLabel);
    }

    // Birth
    if (person.birth.date || person.birth.place) {
        let birthInfo = '';
        if (person.birth.date) birthInfo += person.birth.date;
        if (person.birth.place) {
            if (birthInfo) birthInfo += '<br>';
            birthInfo += person.birth.place;
        }
        addDetailItem(detailsContent, 'Birth', birthInfo);
    }

    // Death
    if (person.death.date || person.death.place) {
        let deathInfo = '';
        if (person.death.date) deathInfo += person.death.date;
        if (person.death.place) {
            if (deathInfo) deathInfo += '<br>';
            deathInfo += person.death.place;
        }
        addDetailItem(detailsContent, 'Death', deathInfo);
    }

    // Parents
    const parents = parser.getParents(person.id);
    if (parents.father) {
        addDetailItem(detailsContent, 'Father', parents.father.name || 'Unknown');
    }
    if (parents.mother) {
        addDetailItem(detailsContent, 'Mother', parents.mother.name || 'Unknown');
    }

    // Children
    const children = parser.getChildren(person.id);
    if (children.length > 0) {
        const childrenNames = children.map(c => c.name || 'Unknown').join(', ');
        addDetailItem(detailsContent, 'Children', childrenNames);
    }

    detailsPanel.classList.remove('hidden');
}

function addDetailItem(container, label, value) {
    const div = document.createElement('div');
    div.className = 'detail-item';
    
    const labelDiv = document.createElement('div');
    labelDiv.className = 'detail-label';
    labelDiv.textContent = label;
    
    const valueDiv = document.createElement('div');
    valueDiv.className = 'detail-value';
    valueDiv.innerHTML = value;
    
    div.appendChild(labelDiv);
    div.appendChild(valueDiv);
    container.appendChild(div);
}

function collectRelevantData(centerPersonId, generations, includeDescendants) {
    const individualIds = new Set();
    const familyIds = new Set();

    // Collect ancestors
    const ancestors = parser.getAncestors(centerPersonId, generations);
    for (const { individual } of ancestors) {
        individualIds.add(individual.id);
        // Add families that link this person to their parents
        for (const famId of individual.familyChild) {
            familyIds.add(famId);
        }
    }

    // Collect descendants if enabled
    if (includeDescendants) {
        const centerPerson = parser.individuals.get(centerPersonId);
        if (centerPerson) {
            for (const famId of centerPerson.familySpouse) {
                familyIds.add(famId);
                const family = parser.families.get(famId);
                if (family) {
                    for (const childId of family.children) {
                        const child = parser.individuals.get(childId);
                        if (child) individualIds.add(child.id);
                    }
                }
            }
        }
    }

    // Also include spouse families for ancestors so family linkage is preserved
    for (const id of individualIds) {
        const ind = parser.individuals.get(id);
        if (ind) {
            for (const famId of ind.familySpouse) {
                familyIds.add(famId);
            }
        }
    }

    const individuals = [];
    for (const id of individualIds) {
        const ind = parser.individuals.get(id);
        if (ind) individuals.push(ind);
    }

    const families = [];
    for (const id of familyIds) {
        const fam = parser.families.get(id);
        if (fam) families.push(fam);
    }

    return { individuals, families };
}

function saveChart() {
    if (!parser || !currentCenterPersonId) {
        showNotification('No chart to save', 'error');
        return;
    }

    const generations = parseInt(document.getElementById('generations').value);
    const showDescendants = document.getElementById('show-descendants').checked;

    const { individuals, families } = collectRelevantData(
        currentCenterPersonId, generations, showDescendants
    );

    const saveData = {
        version: 1,
        centerPersonId: currentCenterPersonId,
        settings: {
            generations: generations,
            fanAngle: parseInt(document.getElementById('fan-angle').value),
            fontSize: parseInt(document.getElementById('font-size').value),
            fontFamily: document.getElementById('font-family').value,
            colorScheme: document.getElementById('color-scheme').value,
            showBirthYear: document.getElementById('show-birth-year').checked,
            showDeathYear: document.getElementById('show-death-year').checked,
            showCountry: document.getElementById('show-country').checked,
            showDescendants: showDescendants
        },
        individuals: individuals,
        families: families
    };

    const json = JSON.stringify(saveData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const centerPerson = parser.individuals.get(currentCenterPersonId);
    const safeName = (centerPerson && centerPerson.name || 'chart')
        .replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '-');

    const link = document.createElement('a');
    link.href = url;
    link.download = safeName + '.fanchart';
    link.click();

    URL.revokeObjectURL(url);
    showNotification('Chart saved!', 'success');
}

function handleLoadChart(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const saveData = JSON.parse(e.target.result);

            if (!saveData.individuals || !saveData.families || !saveData.centerPersonId) {
                showNotification('Invalid save file', 'error');
                return;
            }

            // Rebuild parser from saved data
            parser = new GedcomParser();
            parser.loadFromData(saveData.individuals, saveData.families);

            populateCenterPersonDropdown();

            // Restore settings to UI
            const s = saveData.settings;
            if (s) {
                document.getElementById('generations').value = s.generations;
                document.getElementById('generations-value').textContent = s.generations;
                document.getElementById('fan-angle').value = s.fanAngle;
                document.getElementById('fan-angle-value').textContent = s.fanAngle + '°';
                document.getElementById('font-size').value = s.fontSize;
                document.getElementById('font-size-value').textContent = s.fontSize + 'px';
                document.getElementById('font-family').value = s.fontFamily;
                document.getElementById('color-scheme').value = s.colorScheme;
                document.getElementById('show-birth-year').checked = s.showBirthYear;
                document.getElementById('show-death-year').checked = s.showDeathYear;
                document.getElementById('show-country').checked = s.showCountry;
                document.getElementById('show-descendants').checked = s.showDescendants;
            }

            // Select center person
            currentCenterPersonId = saveData.centerPersonId;
            document.getElementById('center-person').value = currentCenterPersonId;
            document.getElementById('generate-chart').disabled = false;
            document.getElementById('edit-data').disabled = false;
            document.getElementById('file-name').textContent = file.name;

            // Generate chart
            generateChart();

            showNotification('Chart loaded!', 'success');
        } catch (err) {
            console.error('Error loading chart:', err);
            showNotification('Error loading save file', 'error');
        }
    };
    reader.readAsText(file);

    // Reset input so the same file can be loaded again
    event.target.value = '';
}

function openDataEditor() {
    if (!parser) return;

    const tbody = document.querySelector('#data-editor-table tbody');
    tbody.innerHTML = '';

    const individuals = parser.getAllIndividualsArray();
    for (const person of individuals) {
        const tr = document.createElement('tr');
        tr.dataset.id = person.id;

        tr.innerHTML =
            '<td><input type="text" class="edit-name" value="' + escapeAttr(person.name || '') + '"></td>' +
            '<td><input type="text" class="edit-birth-year" value="' + escapeAttr(person.birth.year || '') + '"></td>' +
            '<td><input type="text" class="edit-death-year" value="' + escapeAttr(person.death.year || '') + '"></td>' +
            '<td><input type="text" class="edit-birth-country" value="' + escapeAttr(person.birth.country || '') + '"></td>';

        tbody.appendChild(tr);
    }

    document.getElementById('data-editor-overlay').classList.remove('hidden');
}

function closeDataEditor() {
    document.getElementById('data-editor-overlay').classList.add('hidden');
}

function applyDataEdits() {
    const rows = document.querySelectorAll('#data-editor-table tbody tr');

    for (const row of rows) {
        const id = row.dataset.id;
        const person = parser.individuals.get(id);
        if (!person) continue;

        const newName = row.querySelector('.edit-name').value.trim();
        const newBirthYear = row.querySelector('.edit-birth-year').value.trim();
        const newDeathYear = row.querySelector('.edit-death-year').value.trim();
        const newBirthCountry = row.querySelector('.edit-birth-country').value.trim();

        person.name = newName;

        // Update birth year and re-derive date string
        if (newBirthYear) {
            person.birth.year = newBirthYear;
            if (!person.birth.date) person.birth.date = newBirthYear;
        } else {
            person.birth.year = null;
        }

        // Update death year
        if (newDeathYear) {
            person.death.year = newDeathYear;
            if (!person.death.date) person.death.date = newDeathYear;
        } else {
            person.death.year = null;
        }

        // Update birth country
        if (newBirthCountry) {
            person.birth.country = newBirthCountry;
        } else {
            person.birth.country = null;
        }
    }

    // Refresh the center person dropdown to reflect name changes
    const selectedId = currentCenterPersonId;
    populateCenterPersonDropdown();
    if (selectedId) {
        document.getElementById('center-person').value = selectedId;
        currentCenterPersonId = selectedId;
    }

    closeDataEditor();
    showNotification('Data updated! Click Generate Chart to see changes.', 'success');
}

function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showNotification(message, type) {
    // Simple notification - you could enhance this with a toast library
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.padding = '15px 20px';
    toast.style.borderRadius = '8px';
    toast.style.color = 'white';
    toast.style.fontWeight = 'bold';
    toast.style.zIndex = '10000';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    toast.textContent = message;
    
    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)';
    }
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s';
        toast.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 500);
    }, 3000);
}
