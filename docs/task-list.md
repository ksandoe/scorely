
# Task List

This task list organizes the v1 scope into epics and user stories with acceptance criteria.

## Epic: Manage Accounts

### User Story 1: Create an account

As a user, I want to create an account so that I can store my music ratings.

#### Acceptance Criteria

- **Account creation form**
  - Given I am logged out
  - When I navigate to the sign up screen
  - Then I can enter a username and password and submit the form
- **Validation and feedback**
  - Given I submit the sign up form with missing or invalid fields
  - Then I see a clear validation message and the account is not created
- **Uniqueness**
  - Given a username is already taken
  - When I attempt to sign up with that username
  - Then I am prompted to choose a different username
- **Successful creation**
  - Given I submit valid, unique credentials
  - Then my account is created and I am authenticated (or prompted to log in) and can access the app
- **Persistence**
  - Given I have created an account
  - When I later return and log in
  - Then my previously created ratings/reviews (when they exist) are still available

## Epic: Discover Music

### User Story 2: Search for songs

As a user, I want to search for songs so that I can find music to rate.

#### Acceptance Criteria

- **Search input**
  - Given I am authenticated
  - When I open the song search screen
  - Then I can type a query and initiate a search
- **Results list**
  - Given I submit a query
  - When results exist
  - Then I see a list of matching songs with at least title and primary artist
- **No results state**
  - Given I submit a query with no matches
  - Then I see an empty state indicating no songs were found
- **Select a song**
  - Given I see search results
  - When I select a song
  - Then I can proceed to view the song details and rate/review it

### User Story 8: View a friend’s top five songs

As a user, I want to see a friend’s top five songs so that I can discover music.

#### Acceptance Criteria

- **Top five visibility**
  - Given I am viewing a friend’s profile
  - Then I can see a “Top 5” section listing up to five songs
- **Definition of “Top 5”**
  - Given the friend has rated songs
  - Then the Top 5 list is based on their highest ratings (with a deterministic tie-breaker such as most recent rating)
- **Empty state**
  - Given the friend has not rated any songs
  - Then the Top 5 section shows an empty state
- **Navigation**
  - Given I am viewing the Top 5 list
  - When I select a song
  - Then I am taken to that song’s details page (or equivalent) to view rating/review details

## Epic: Rate Music

### User Story 3: Rate songs (1–5 stars)

As a user, I want to rate songs from 1–5 stars so that I can record my opinion.

#### Acceptance Criteria

- **Rating control**
  - Given I am viewing a song details page
  - Then I can select a star rating from 1 to 5
- **Save rating**
  - Given I select a rating
  - When I submit/save
  - Then the rating is persisted and visible on the song details page
- **Update rating**
  - Given I have already rated a song
  - When I change the rating and save
  - Then my previous rating is updated (not duplicated) and the latest value is shown
- **Required constraints**
  - Given I attempt to save a rating outside 1–5
  - Then the app prevents saving and shows an error

### User Story 4: Write short reviews (~500 characters)

As a user, I want to write reviews about songs so that I can share my thoughts.

#### Acceptance Criteria

- **Optional review**
  - Given I am rating a song
  - Then I can optionally add a text review
- **Character limit**
  - Given I enter a review longer than 500 characters
  - Then the app prevents saving and indicates the limit
- **Save and display**
  - Given I save a valid review
  - Then the review is persisted and displayed with my rating for that song
- **Edit review**
  - Given I previously saved a review
  - When I edit and save it
  - Then the updated review replaces the previous one

## Epic: Archive Listening

### User Story 6: View listening history (most recent → oldest)

As a user, I want to view my listening history so that I can see songs I rated before.

#### Acceptance Criteria

- **History list**
  - Given I am authenticated
  - When I navigate to my listening history
  - Then I see a list of songs I have rated, ordered most recent to oldest
- **Displayed fields**
  - Given I am viewing my listening history
  - Then each item shows at least song title, artist, my rating, and the date rated
- **Empty state**
  - Given I have not rated any songs
  - Then I see an empty state with guidance to search and rate songs

### User Story 5: Filter/sort and bookmark top picks

As a user, I want to filter my listening history by songs I rated 4 or 5 stars so that I can revisit my top picks.

#### Acceptance Criteria

- **Filter by rating**
  - Given I am viewing my listening history
  - When I apply a filter for 4–5 stars
  - Then only songs with ratings of 4 or 5 are shown
- **Sort options**
  - Given I am viewing my listening history
  - Then I can sort by Date rated, Genre, Artist, and Year released
- **Bookmark songs**
  - Given I am viewing a song in my history
  - When I bookmark it
  - Then it is marked as bookmarked and remains bookmarked across sessions
- **Bookmark list access**
  - Given I have bookmarked songs
  - When I view my bookmarked items (via filter or dedicated view)
  - Then I see only bookmarked songs

## Epic: Connect with Friends

### User Story 7: View a friend’s profile and ratings

As a user, I want to view a friend’s profile so that I can see their ratings.

#### Acceptance Criteria

- **Profile access**
  - Given I am authenticated
  - When I navigate to a friend’s profile
  - Then I see basic profile information and their public rating activity
- **Ratings list**
  - Given I am on a friend’s profile
  - Then I can see a list of songs they have rated with rating value and date rated
- **Privacy / access control**
  - Given I am not allowed to view a user’s profile (e.g., not friends if the app requires it)
  - When I attempt to access their profile
  - Then I see an appropriate access denied or not found message

