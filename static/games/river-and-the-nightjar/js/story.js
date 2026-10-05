// Words that belong to the whole journey: the chapter list and the keepsakes.
export const CHAPTER_LIST = [
  { n: 'Prologue', title: 'The Hum in the Dark', mood: 'mystery' },
  { n: 'Chapter One', title: 'The Impossible Train', mood: 'wonder' },
  { n: 'Chapter Two', title: 'The Waymark', mood: 'wonder' },
  { n: 'Chapter Three', title: 'The Rolling Kettle', mood: 'play' },
  { n: 'Chapter Four', title: 'Thimble Pass', mood: 'danger' },
  { n: 'Chapter Five', title: 'Car Nought', mood: 'eerie' },
  { n: 'Chapter Six', title: 'The Lost Way', mood: 'mystery' },
  { n: 'Chapter Seven', title: 'Kindlewick', mood: 'city' },
  { n: 'Chapter Eight', title: 'The Runaway Gift Convoy', mood: 'play' },
  { n: 'Chapter Nine', title: 'The Great Winter Gathering', mood: 'gathering' },
  { n: 'Epilogue', title: 'The Journey Home', mood: 'home' },
];

// Two keepsakes hide in every chapter. Together they tell the history of the railway.
export const KEEPSAKES = [
  { id: 'k01', ch: 0, kind: 'stamp', title: 'First Frost Stamp', text: 'A stamp with no country on it. Only a small bird, and the words: Good for one night.' },
  { id: 'k02', ch: 0, kind: 'postcard', title: 'Postcard, unsigned', text: 'A picture of a train on a street just like yours. On the back it says: It stops for the ones who are still wondering.' },
  { id: 'k03', ch: 1, kind: 'badge', title: "Wayfinder's Badge", text: 'The first Wayfinder was a lamplighter who ran out of streets to light. So she lit a road north.' },
  { id: 'k04', ch: 1, kind: 'page', title: 'Journal page: The Rails', text: 'The Nightjar needs no tracks. It spins its own from frozen light, and they melt behind it by morning.' },
  { id: 'k05', ch: 2, kind: 'snowflake', title: 'Six-armed snowflake', text: 'A clockwork snowflake. Wound once, it ticks for exactly one snowfall.' },
  { id: 'k06', ch: 2, kind: 'stamp', title: "Roof Walker's Stamp", text: 'Given to travelers who have been on top of the train. The Wayfinders pretend not to know how many there are.' },
  { id: 'k07', ch: 3, kind: 'postcard', title: 'Postcard from the Kettle Car', text: 'A recipe on the back: pears, a spoon of honey, one star of anise, and somebody to share it with.' },
  { id: 'k08', ch: 3, kind: 'badge', title: "Kettle Keeper's Badge", text: 'The Kettle Car has fed every passenger since the first journey and has never once run out. Nobody checks why.' },
  { id: 'k09', ch: 4, kind: 'page', title: 'Journal page: Mirrormere', text: 'Lake Mirrormere freezes so clear that you can see the fish asleep under your boots.' },
  { id: 'k10', ch: 4, kind: 'badge', title: "Engineer's Badge", text: "Pym's grandmother drove the Nightjar. So did her grandmother. The engine remembers all of them." },
  { id: 'k11', ch: 5, kind: 'page', title: 'Journal page: Car Nought', text: 'The very first carriage. It is never full and never empty, and it is always coupled last.' },
  { id: 'k12', ch: 5, kind: 'stamp', title: 'Unclaimed stamp', text: 'From a passenger list of long ago: V., seat unassigned, paid in full. Paid with what, it does not say.' },
  { id: 'k13', ch: 6, kind: 'snowflake', title: 'Kiln snowflake', text: "Forged in the star-kiln, where summer's northern lights are kept warm for winter." },
  { id: 'k14', ch: 6, kind: 'badge', title: "Stoker's Badge", text: 'The kiln burns light, not coal. Every hundred miles it must be fed something bright. A song will do.' },
  { id: 'k15', ch: 7, kind: 'postcard', title: 'Postcard of Kindlewick', text: 'A city inside a sleeping volcano. The ground is warm, so the snow only stays where people want it.' },
  { id: 'k16', ch: 7, kind: 'stamp', title: 'Lantern Lift stamp', text: 'Kindlewick has four thousand lanterns. Each one has a name, and the lamplighters know them all.' },
  { id: 'k17', ch: 8, kind: 'snowflake', title: 'Sorting snowflake', text: 'A spare part from the Great Sorter, which has never sent a parcel to the wrong place. It has, once, sent some children.' },
  { id: 'k18', ch: 8, kind: 'page', title: 'Journal page: The Burrow', text: 'Under the city run the delivery tunnels, where every gift is weighed, wrapped and wished upon.' },
  { id: 'k19', ch: 9, kind: 'badge', title: "Kindler's Badge", text: 'The first Kindler shared her last candle with a stranger on the longest night. The candle never burned down.' },
  { id: 'k20', ch: 9, kind: 'postcard', title: 'Postcard: The Sky Road', text: 'On the longest night the gifts leave as sparks, up the Sky Road, and come down as softly as snow.' },
  { id: 'k21', ch: 10, kind: 'snowflake', title: 'Morning snowflake', text: 'It stopped ticking when the snow did. It will start again next winter.' },
  { id: 'k22', ch: 10, kind: 'page', title: 'Journal page: The last line', text: 'Not everything true leaves tracks.' },
];
export const KEEPSAKE = Object.fromEntries(KEEPSAKES.map(k => [k.id, k]));

// Name tab colours in the dialogue box.
export const VOICES = {
  River: { color: '#2a6fd0', pitch: 1.45, rate: 1 }, Tavi: { color: '#d9742a', pitch: 1.55, rate: 1.12 }, Wren: { color: '#7a5fc4', pitch: 1.35, rate: .9 },
  Mari: { color: '#b8920e', pitch: 1.3, rate: 1.05 }, Bo: { color: '#3d8fd0', pitch: 1.8, rate: 1 }, Dex: { color: '#5d6b78', pitch: 1.05, rate: 1 },
  Ibby: { color: '#3f7a4a', pitch: .95, rate: .95 }, Pym: { color: '#a8542a', pitch: 1.1, rate: 1.1 }, Vesper: { color: '#5d587f', pitch: .55, rate: .8 },
  Maren: { color: '#22408f', pitch: .75, rate: .88 }, Mom: { color: '#3f9f8f', pitch: 1.1, rate: 1 }, Dad: { color: '#34507a', pitch: .8, rate: 1 },
  Kindlefolk: { color: '#2a8f8a', pitch: 1.2, rate: 1.05 }, Justice: { color: '#8a8f9c', pitch: 1, rate: 1 },
};
