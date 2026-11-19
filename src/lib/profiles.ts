export type Profile = {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[];
  distance: string;
  likedYou?: boolean;
};

// These fictional demo profiles use remote Unsplash portrait images.
const people = [
  ["Maya", 25, "Pune", "A good playlist, a long walk, and finding the best chai in town.", ["Live music", "Coffee", "Hiking"]],
  ["Riya", 24, "Mumbai", "Collecting little moments and big book recommendations.", ["Books", "Art", "Travel"]],
  ["Ananya", 26, "Bengaluru", "Weekend baker, weekday designer. Always up for a museum date.", ["Baking", "Design", "Museums"]],
  ["Zara", 23, "Delhi", "Here for good food, better conversations, and dogs everywhere.", ["Food", "Dogs", "Cinema"]],
  ["Isha", 25, "Hyderabad", "Sunrise runs, sunset films, and everything in between.", ["Running", "Films", "Travel"]],
  ["Naina", 27, "Jaipur", "I make ceramics and a very convincing case for dessert.", ["Pottery", "Cooking", "Art"]],
  ["Aarav", 26, "Mumbai", "Photographer chasing soft light and spicy street food.", ["Photography", "Food", "Cycling"]],
  ["Kabir", 24, "Pune", "Guitar player, terrible dancer, excellent brunch companion.", ["Music", "Brunch", "Tennis"]],
  ["Dev", 28, "Bengaluru", "Building things by day, looking for the next trail by weekend.", ["Startups", "Hiking", "Coffee"]],
  ["Arjun", 25, "Delhi", "Film nerd with a soft spot for old bookstores.", ["Cinema", "Books", "Cricket"]],
  ["Meera", 24, "Chennai", "Learning to surf. Happy to teach you absolutely nothing about it.", ["Surfing", "Travel", "Music"]],
  ["Sana", 26, "Kolkata", "Home cook who believes every problem needs more pasta.", ["Cooking", "Food", "Reading"]],
  ["Tara", 23, "Mumbai", "Slow mornings, good design, and spontaneous train tickets.", ["Design", "Travel", "Yoga"]],
  ["Aditi", 27, "Pune", "Equal parts quiet café and loud concert energy.", ["Concerts", "Coffee", "Yoga"]],
  ["Neha", 25, "Bengaluru", "Plant parent, amateur runner, professional snack finder.", ["Plants", "Running", "Food"]],
  ["Vihaan", 27, "Hyderabad", "Exploring new cities one local breakfast at a time.", ["Travel", "Food", "Photography"]],
  ["Rohan", 25, "Delhi", "I know a great spot for momos. This is my best opening line.", ["Food", "Comedy", "Football"]],
  ["Ishaan", 26, "Chennai", "Weekend cyclist and aspiring home barista.", ["Cycling", "Coffee", "Music"]],
  ["Sameer", 24, "Kolkata", "Making playlists for people who haven't asked yet.", ["Music", "Books", "Football"]],
  ["Kunal", 28, "Jaipur", "Architect by trade, mountain person by choice.", ["Architecture", "Hiking", "Travel"]],
  ["Leah", 25, "Mumbai", "Trying every bakery in the city. Research, obviously.", ["Baking", "Art", "Dogs"]],
  ["Priya", 26, "Delhi", "Museum dates and unreasonably competitive board games.", ["Museums", "Games", "Books"]],
  ["Diya", 24, "Bengaluru", "A little bit of yoga, a lot of very good food.", ["Yoga", "Food", "Travel"]],
  ["Simran", 27, "Pune", "When I am not at work, I am probably at a gig.", ["Live music", "Dance", "Cinema"]],
  ["Noor", 23, "Hyderabad", "Sketchbook in my bag, always looking for a new view.", ["Art", "Photography", "Hiking"]],
  ["Anika", 25, "Chennai", "Ocean air and a book I will finish in one sitting.", ["Beach", "Reading", "Cooking"]],
  ["Rhea", 28, "Kolkata", "Finding joy in the everyday and the occasional fancy dinner.", ["Food", "Theatre", "Travel"]],
  ["Sanya", 24, "Jaipur", "A terrible singer with excellent concert ticket taste.", ["Concerts", "Films", "Coffee"]],
  ["Nikhil", 26, "Pune", "Trying to cook my way through my grandmother's recipes.", ["Cooking", "Cycling", "Books"]],
  ["Aditya", 27, "Mumbai", "Runner, reader, and the friend who plans the group trip.", ["Running", "Travel", "Cricket"]],
];

const photoIds = [
  "1534528741775-53994a69daeb", "1524504388940-b1c1722653e1", "1531123897727-8f129e1688ce", "1529139574466-a303027c1d8", "1517841905240-472988babdf9", "1524250502761-1ac6f2e30d43",
  "1500648767791-00dcc994a43e", "1506794778202-cad84cf45f1d", "1507003211169-0a1dd7228f2d", "1501196354995-cbb51c65aaea", "1504593811423-6dd665756598", "1519085360753-af0119f7cbe7",
  "1529626455594-4ff0802cfb7e", "1534528741775-53994a69daeb", "1531123897727-8f129e1688ce", "1500648767791-00dcc994a43e", "1506794778202-cad84cf45f1d", "1507003211169-0a1dd7228f2d",
  "1519085360753-af0119f7cbe7", "1501196354995-cbb51c65aaea", "1517841905240-472988babdf9", "1524250502761-1ac6f2e30d43", "1524504388940-b1c1722653e1", "1534528741775-53994a69daeb",
  "1529139574466-a303027c1d8", "1531123897727-8f129e1688ce", "1529626455594-4ff0802cfb7e", "1517841905240-472988babdf9", "1500648767791-00dcc994a43e", "1506794778202-cad84cf45f1d"
];

export const profiles: Profile[] = people.map(([name, age, location, bio, interests], index) => ({
  id: `profile-${String(index + 1).padStart(2, "0")}`,
  name: name as string,
  age: age as number,
  location: location as string,
  bio: bio as string,
  interests: interests as string[],
  photo: `https://images.unsplash.com/photo-${photoIds[index]}?auto=format&fit=crop&w=900&q=85`,
  distance: `${(index % 14) + 1} km away`,
}));

// Incoming likes are stored privately on the server. Never include this flag in feed responses.
export const incomingLikes = new Set(["profile-02", "profile-05", "profile-09", "profile-14", "profile-21", "profile-27"]);
