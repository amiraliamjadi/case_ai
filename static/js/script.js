document.getElementById('apply-filters').addEventListener('click', () => {
    const germanyRadio = document.getElementById('germany');
    const country = germanyRadio.checked ? "Germany" : "Austria";
    const branch = document.getElementById('branch').value;
    const category = document.getElementById('category').value;

    const applyButton = document.getElementById('apply-filters');
    applyButton.disabled = true;
    applyButton.textContent = 'Applying...';

    fetch('/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country, branch, category })
        })
        .then(response => response.json())
        .then(data => {
            // Populate charts
            createChart('chart1', data['Sheet2'], 'Branches', 'Average_Sentiment_Score');
            handleFeeling('chart2', data['Sheet3'], 'Country', 'Average_Sentiment_Score');
            createChart('chart3', data['Sheet4'], 'Categories', 'Average_Keyword_Sentiment_Score');
            if (branch !== "") {
                document.getElementById("chart4").style.display = "block";
                createChart('chart4', data['Sheet5'], 'Keyword', 'Average_Sentiment', 'Count');
            } else {
                document.getElementById("chart4").style.display = "none";

            }

            // Update Overview Table
            updateOverview(data);

            // Populate translated descriptions with sentiment scores
            const descriptionList = document.getElementById('description-list');
            descriptionList.innerHTML = ''; // Clear existing descriptions
            data['Sheet1'].slice(0, 4).forEach(item => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                ${item['Translated_Descriptions']}
                <span>(Sentiment: ${item['Keyword_Sentiment_Score'].toFixed(2)})</span>
            `;
                descriptionList.appendChild(listItem);
            });

            applyButton.disabled = false;
            applyButton.textContent = 'Apply Filters';
        })
        .catch(error => {
            console.error('Error fetching filtered data:', error);
            applyButton.disabled = false;
            applyButton.textContent = 'Apply Filters';
            alert('An error occurred while applying filters. Please try again.');
        });
});

function createChart(containerId, data, xField, yField, zField = null) {
    if (data.length === 0) {
        document.getElementById(containerId).innerHTML = `<p>No data available for the selected filters.</p>`;
        return;
    }

    // Remove duplicates based on xField (Keyword)
    const uniqueData = Array.from(
        new Map(data.map(item => [item[xField], item])).values()
    );

    const x = uniqueData.map(item => item[xField]);
    const y = uniqueData.map(item => Math.min(item[yField], 5)); // Cap bar heights

    let trace = {
        x,
        y,
        type: 'bar',
        marker: { color: containerId === "chart4" ? "#FF617D" : '#1E3A8A' },
    };

    if (zField && containerId === "chart4") {
        const z = uniqueData.map(item => item[zField]);
        trace.text = z.map(value => `Count: ${value}`);
        trace.textposition = 'auto';
    }

    Plotly.newPlot(containerId, [trace], {
        title: { text: `${xField} vs ${yField}`, font: { size: 14 } },
        xaxis: { title: { text: xField, font: { size: 14 } }, tickangle: -45, automargin: true },
        yaxis: { title: { text: yField, font: { size: 14 } }, automargin: true },
        margin: {
            t: 50, // Top margin
            b: 130, // Bottom margin to prevent label overlap
            l: 50, // Left margin
            r: 50 // Right margin
        },
        width: containerId === "chart4" ? 1000 : 500,
        height: 355,
    }, {
        displayModeBar: false, // Disable the toolbar
    }, { responsive: true });

}

function handleFeeling(containerId, data) {
    if (data.length === 0) {
        document.getElementById(containerId).innerHTML = `<p>No data available for the selected filters.</p>`;
        return;
    }

    if (containerId === "chart2") {
        function get_emoji(score) {
            if (score < 1)
                return "😢";
            else if (score < 2)
                return "😒";
            else if (score < 3)
                return "😐";
            else if (score < 4)
                return "😊";
            else
                return "😄";
        }
        var parentElement = document.getElementById("chart2");
        var score = document.getElementById("score");
        var label = document.getElementById("label");
        parentElement.textContent = get_emoji(data[0].Average_Sentiment_Score);
        score.textContent = data[0].Average_Sentiment_Score;
        label.textContent = "Country sentiment";
        parentElement.style.fontSize = "200px";
    }
}

function updateOverview(data) {
    const germanyRadio = document.getElementById('germany');
    const austriaRadio = document.getElementById('austria');

    const branch = document.getElementById('branch');
    var numberOfBranchOptions = branch.options.length - 1;

    document.getElementById('country-count').textContent = (germanyRadio.checked || austriaRadio.checked) ? 1 : 2;
    document.getElementById('branch-count').textContent = data['branches'] ? data['branches'].length : numberOfBranchOptions;
    document.getElementById('category-count').textContent = data['categories'] ? data['categories'].length : 6;
}

function updateBranches(country) {
    const branchSelect = document.getElementById('branch');
    const category = document.getElementById('category');
    const filter = document.getElementById('apply-filters');
    const germanyRadio = document.getElementById('germany');
    const austriaRadio = document.getElementById('austria');

    // Enable the select box only if one of the countries is selected
    if ((country === 'Germany' && germanyRadio.checked) || (country === 'Austria' && austriaRadio.checked)) {
        branchSelect.disabled = false;
        filter.disabled = false;
        category.disabled = false;
    } else {
        branchSelect.disabled = true;
        filter.disabled = true;
        category.disabled = true;
    }

    fetch('/get-branches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ country })
        })
        .then(response => response.json())
        .then(branches => {
            const branchSelect = document.getElementById('branch');
            branchSelect.innerHTML = '<option value="">All</option>';
            branches.forEach(branch => {
                branchSelect.innerHTML += `<option value="${branch}">${branch}</option>`;
            });
        })
        .catch(error => console.error('Error updating branches:', error));
}