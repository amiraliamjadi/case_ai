from flask import Flask, render_template, request, jsonify
import pandas as pd

app = Flask(__name__)

# Load Excel data
file_path = 'data/database.xlsx'
sheets = {
    'Sheet1': pd.read_excel(file_path, sheet_name='Sheet1'),  # Includes Translated Descriptions and Sentiment Scores
    'Sheet2': pd.read_excel(file_path, sheet_name='Sheet2'),
    'Sheet3': pd.read_excel(file_path, sheet_name='Sheet3'),
    'Sheet4': pd.read_excel(file_path, sheet_name='Sheet4'),
    'Sheet5': pd.read_excel(file_path, sheet_name='Sheet5'),
}

@app.route('/')
def index():
    countries = sheets['Sheet2']['Country'].dropna().unique().tolist()
    categories = sheets['Sheet4']['Categories'].dropna().unique().tolist()
    return render_template('dashboard.html', countries=countries, categories=categories)

@app.route('/get-branches', methods=['POST'])
def get_branches():
    selected_country = request.json.get('country')
    branches = sheets['Sheet2']
    if selected_country:
        branches = branches[branches['Country'] == selected_country]
    branches_list = branches['Branches'].dropna().unique().tolist()
    return jsonify(branches_list)

@app.route('/filter', methods=['POST'])
def filter_data():
    filters = request.json
    country = filters.get('country')
    branch = filters.get('branch')
    category = filters.get('category')

    filtered_data = {}
    for sheet_name, data in sheets.items():
        if sheet_name == 'Sheet1':  # Skip descriptions for now
            continue

        df = data.copy()
        if 'Country' in df.columns and country:
            df = df[df['Country'] == country]
        if 'Branches' in df.columns and branch:
            df = df[df['Branches'] == branch]
        if 'Categories' in df.columns and category:
            df = df[df['Categories'] == category]
        
        filtered_data[sheet_name] = df.to_dict(orient='records')

    # Add unique translated descriptions with sentiment scores from Sheet1
    descriptions = sheets['Sheet1']
    if branch:
        descriptions = descriptions[descriptions['Branches'] == branch]
    
    unique_descriptions = (
        descriptions[['Translated_Descriptions', 'Keyword_Sentiment_Score']]
        .dropna()
        .groupby('Translated_Descriptions', as_index=False)
        .mean()  # Calculate the average sentiment score for each sentence
    )
    filtered_data['Sheet1'] = unique_descriptions.to_dict(orient='records')
    return jsonify(filtered_data)

if __name__ == '__main__':
    app.run(host="127.0.0.1", port=5000)
