# Next Steps - Getting Started with Readwise Integration

## ✅ Step 1: Test Connection (Done!)
You've successfully tested the Readwise API connection. Great!

## 🚀 Step 2: Sync Highlights

1. **Start the development server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Sync your highlights**:
   - Click the "Sync Highlights" button on the home page
   - Watch the server terminal for progress logs
   - You should see logs like:
     ```
     [ReadwiseClient] Fetching highlights from Readwise API...
     [ReadwiseClient] Found X highlights in this page
     [RetrieverAgent] Received X highlights from Readwise
     ```

4. **View your highlights**:
   - Click "View Highlights" to see the synced highlights
   - Verify your highlights are being imported correctly

## 💡 Step 3: Generate Blog Ideas

1. **Go to the Ideas page**:
   - Click "View Ideas" from the home page
   - Or navigate to [http://localhost:3000/ideas](http://localhost:3000/ideas)

2. **Generate ideas**:
   - Click "Generate Ideas" button
   - The system will:
     - Take your top highlights
     - Generate 5-10 blog post ideas
     - Automatically curate and score them
   - This may take 30-60 seconds

3. **Review ideas**:
   - Green border = Shortlisted (recommended)
   - Red border = Rejected
   - Yellow border = Needs review
   - Each idea shows curator scores and feedback

4. **Regenerate if needed**:
   - Click "Regenerate Ideas" if you want different ideas
   - Provide feedback/direction to guide the AI

## ✍️ Step 4: Create Blog Drafts

1. **Select an idea**:
   - Click "Create Draft" on any shortlisted idea
   - Or create drafts for multiple ideas

2. **Wait for generation**:
   - Draft creation takes 1-2 minutes per idea
   - Watch the progress indicator
   - Check server logs for detailed progress

3. **View drafts**:
   - Navigate to [http://localhost:3000/drafts](http://localhost:3000/drafts)
   - Click "Expand" to see:
     - Full blog draft (1200-1800 words)
     - Detailed outline
     - Alternative hooks (5 variations)
     - Social post bullets (10 bullets)
     - Supporting highlights

## 🔍 Troubleshooting

### If sync fails:
- Check server logs for error messages
- Verify `READWISE_ACCESS_TOKEN` is set correctly in `.env`
- Restart the dev server after changing `.env`
- Run `npm run test:readwise` to verify token

### If no highlights appear:
- Make sure you have highlights in your Readwise account
- Check the "View Highlights" button to see what was synced
- Look at server logs for any errors

### If ideas aren't generating:
- Check OpenAI API key is set
- Verify you have enough highlights (at least 5-10 recommended)
- Check server logs for LLM errors

## 📊 What to Expect

### First Sync:
- May take 1-2 minutes if you have many highlights
- Creates embeddings for semantic search
- Stores all highlights in the database

### Idea Generation:
- Takes 30-60 seconds
- Generates 5-10 ideas
- Automatically curates and scores them

### Draft Creation:
- Takes 1-2 minutes per draft
- Generates 1200-1800 word blog posts
- Includes full outline and repurpose pack

## 🎯 Recommended Workflow

1. **Sync highlights** → Get all your highlights imported
2. **Generate ideas** → Let the AI create blog post ideas
3. **Review & curate** → Check scores and feedback
4. **Regenerate if needed** → Provide direction for better ideas
5. **Create drafts** → Turn shortlisted ideas into full blog posts
6. **Review drafts** → Expand and review the generated content

## 💡 Tips

- **More highlights = better ideas**: The more highlights you sync, the more material the AI has to work with
- **Use tags**: If your Readwise highlights have tags, they'll be preserved and can help with organization
- **Review curator feedback**: The curator provides specific feedback on why ideas were scored the way they were
- **Iterate**: Don't hesitate to regenerate ideas with specific direction (e.g., "focus on AI infrastructure topics")

## 🚨 Common Issues

**"No highlights found"**
- Make sure you've synced highlights first
- Check that your Readwise account has highlights

**"Rate limit exceeded"**
- Readwise allows 240 requests/min (20/min for LIST endpoints)
- Wait a minute and try again

**"Authentication failed"**
- Verify your `READWISE_ACCESS_TOKEN` is correct
- Get a new token from https://readwise.io/access_token

Ready to start? Run `npm run dev` and navigate to http://localhost:3000!

