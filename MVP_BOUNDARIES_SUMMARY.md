# MVP Boundaries - Quick Reference

## Top 10 Excluded Features

1. ❌ **Full Offline LLM** - Use browser-native Web Speech API instead
2. ❌ **Conversational Memory** - Single-query search only
3. ❌ **Real-time Personalization** - Static, curated content only
4. ❌ **Cloud-Only Voice Recognition** - Browser-native offline STT/TTS
5. ❌ **User Accounts** - Anonymous usage only
6. ❌ **Cloud Sync** - Local storage only
7. ❌ **AI-Generated Content** - Pre-curated packs only
8. ❌ **Payment Processing** - UI placeholders only
9. ❌ **Social Features** - No sharing, reviews, or community
10. ❌ **Advanced Analytics** - No tracking or monitoring

---

## Exclusion Categories

### AI & ML ❌
- Full offline LLM
- Conversational memory
- Real-time personalization
- AI-generated content
- Advanced NLU

### Voice & Speech ❌
- Cloud-only voice recognition
- Custom voice models
- Multi-language support
- Voice commands

### Connectivity ❌
- Cloud sync
- Real-time updates
- Background sync
- Multi-device support

### User Features ❌
- User accounts
- User preferences
- Favorites/bookmarks
- Search history
- User-generated content

### Social ❌
- Social sharing
- User reviews/ratings
- Community features

### Advanced Search ❌
- Semantic search
- Image search
- GPS location search
- Advanced filters

### Analytics ❌
- User analytics
- Performance monitoring
- A/B testing

### Payment ❌
- Payment processing
- Subscription management
- In-app purchases

---

## What IS Included ✅

- Offline-first search
- Browser-native voice input/output
- Local pack storage
- Basic connectivity detection
- Keyword/tag matching
- Pre-curated pack content
- Tier-based premium UI

---

## Decision Framework

**Exclude if**:
- Requires external services
- Requires user accounts
- Requires AI/ML models
- Breaks offline-first
- Adds significant complexity

**Include if**:
- Uses browser-native APIs
- Enhances core search
- Works offline
- Simple implementation

---

## Purpose

- **Keep build lean** - Focus on core value
- **Prevent scope creep** - Clear boundaries
- **Protect reliability** - Avoid complexity
