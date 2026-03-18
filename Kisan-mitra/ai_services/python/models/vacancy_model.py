# ai_services/python/models/vacancy_model.py
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

def predict_vacancy_demand():
    # Dummy data for demonstration
    data = {
        'region': ['north', 'south', 'east', 'west'] * 10,
        'skill': ['weeding', 'harvesting', 'planting', 'sowing'] * 10,
        'demand': [10, 20, 15, 25] * 10
    }
    df = pd.DataFrame(data)

    # Features and target
    X = df[['region', 'skill']]
    y = df['demand']

    # One-hot encode categorical features
    X = pd.get_dummies(X, columns=['region', 'skill'])

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train a simple model
    model = RandomForestClassifier()
    model.fit(X_train, y_train)

    # Predict for all combinations of region and skill
    all_regions = df['region'].unique()
    all_skills = df['skill'].unique()
    
    predictions = []
    for region in all_regions:
        for skill in all_skills:
            # Create a dataframe for prediction
            pred_df = pd.DataFrame([[region, skill]], columns=['region', 'skill'])
            pred_df_encoded = pd.get_dummies(pred_df, columns=['region', 'skill'])
            
            # Align columns with the training data
            pred_df_aligned = pred_df_encoded.reindex(columns=X_train.columns, fill_value=0)

            # Predict
            demand = model.predict(pred_df_aligned)[0]
            predictions.append({'region': region, 'skill': skill, 'demand': int(demand)})
            
    return predictions
