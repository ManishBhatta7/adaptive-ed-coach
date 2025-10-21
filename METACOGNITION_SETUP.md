# Metacognition Feature Setup Guide

The metacognition feature has been implemented and is ready to use. Here's how to set it up and test it:

## 🚀 Quick Start

### 1. Database Setup
Run the database migration to create the required tables:
```bash
# Apply the migration (assuming Supabase CLI is configured)
supabase db push
```

Or manually run the SQL from:
`supabase/migrations/20251017_metacognition_feature.sql`

### 2. Configure AI (Required for Feedback)
Set up the DeepSeek API key in your Supabase project:
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Add the secret: `DEEPSEEK_API_KEY` with your API key
4. Also add: `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy Edge Function
Deploy the AI feedback function:
```bash
supabase functions deploy generate-metacog-feedback
```

### 4. Access the Feature
Navigate to `/metacognition` in your app to access the feature.

## 🎯 How It Works

### For Students:
1. **Submit Reflections**: Fill out the reflection form describing:
   - The problem they worked on
   - Which strategy they used (Visualize, Formula, Example, etc.)
   - Their thoughts on the strategy's effectiveness
   - Difficulty rating

2. **Earn Badges**: Automatic badge system awards:
   - 🤔 **Reflector**: First reflection submitted
   - 🧠 **Deep Thinker**: 10+ quality reflections (avg rating 1.5+)
   - 🎯 **Strategy Master**: Used all 6 available strategies
   - 🌱 **Growth Mindset**: 5+ reflections in 30 days with good ratings

3. **Track Progress**: View metacognition score, badge collection, and reflection history

### For Teachers:
1. **Review Reflections**: See all student reflections from their classrooms
2. **Rate Quality**: Rate reflections 0-2 (Needs Improvement, Good, Excellent)
3. **Provide Feedback**: Add written feedback to help students improve
4. **Generate AI Feedback**: Use AI to provide additional constructive feedback
5. **Export Data**: Download CSV reports of all reflection data

## 🔧 Features Included

### Database Schema
- ✅ `reflections` table with full reflection data
- ✅ `badge_definitions` table with badge criteria
- ✅ `student_badges` junction table
- ✅ Automatic scoring triggers
- ✅ Row Level Security (RLS) policies

### Components
- ✅ `ReflectionCard`: Student reflection submission form
- ✅ `MetacogDashboard`: Teacher review and rating interface
- ✅ `StudentMetacogView`: Student progress dashboard
- ✅ `MetacognitionPage`: Main page combining both views

### API Integration
- ✅ Edge Function for AI-powered feedback generation
- ✅ DeepSeek API integration for cost-effective AI responses
- ✅ Automatic database updates with generated feedback

### Scoring System
- ✅ Automatic metacognition score calculation based on:
  - Reflection length and complexity
  - Use of logical connectors ("because", "therefore", etc.)
  - Teacher ratings
- ✅ Badge award system with automated checking
- ✅ Real-time progress tracking

## 🎮 Testing the Feature

### As a Student:
1. Navigate to `/metacognition`
2. Fill out and submit a reflection
3. Check that you earned the "Reflector" badge
4. Submit more reflections with different strategies
5. View your progress dashboard

### As a Teacher:
1. Navigate to `/metacognition`
2. Switch to the "Student Reflections" tab
3. Review student submissions
4. Rate a reflection (0-2)
5. Generate AI feedback
6. Export data to CSV

### Testing AI Feedback:
1. Ensure `DEEPSEEK_API_KEY` is configured
2. Submit a reflection as a student
3. As a teacher, click "Generate AI Feedback"
4. Verify the AI feedback appears in the student's view

## 🐛 Troubleshooting

### Database Issues
- Ensure the migration ran successfully
- Check that RLS policies are enabled
- Verify user profiles exist

### AI Feedback Not Working
- Check Supabase Edge Function logs
- Verify `DEEPSEEK_API_KEY` is set correctly
- Ensure the Edge Function is deployed

### Badge Not Awarding
- Check database triggers are working
- Verify badge criteria logic in `useMetacognition.ts`
- Check student profile updates

### Authentication Issues
- Ensure users are properly authenticated
- Check RLS policies match your auth setup
- Verify classroom memberships for teachers

## 🔄 Next Steps

1. **Test thoroughly** with multiple student and teacher accounts
2. **Monitor AI costs** and usage patterns
3. **Gather feedback** from actual users
4. **Iterate** on the scoring algorithm based on teacher input
5. **Add more badge types** based on usage patterns

## 📊 Analytics & Monitoring

The system automatically tracks:
- Student engagement with reflections
- Teacher rating patterns
- AI feedback usage
- Badge acquisition rates
- Metacognition score improvements

Use the export functionality to analyze learning patterns and improve the feature over time.