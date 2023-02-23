/**
 * Validates the inputs of an entry.
 * @param {Object} entryObject - An entry object
 * @param {Object} response - The response object
 * @returns {String | void} - Returns an error message if the input is invalid, otherwise returns nothing.
 */
function validateEntryInput(entryObject) {
  // Ensure that certain inputs consist of words, separated by one space 
  // and the allowed length of each input is 0-100 characters.
  const MAX_INPUT_LENGTH_BIG = 100;
  const MAX_INPUT_LENGTH_SMALL = 10;
  
  if (!entryObject.fish || !entryObject.date || !entryObject.time || !entryObject.person) {
    return 'kalalaji, päivämäärä, kellonaika tai saajan nimi puuttuu.';
  }

  if (entryObject.lure.length > MAX_INPUT_LENGTH_BIG) {
    return `vieheen nimi saa olla enintään ${MAX_INPUT_LENGTH_BIG} merkkiä pitkä.`;
  } else if (!/^([^\s]+)+((\s)[^\s]+)*$|^$/.test(entryObject.lure)) {
    return "erota vieheen nimen osat toisistaan vain yhdellä välilyönnillä.";
  } else if (/[^aeiouyäöAEIOUYÄÖ]{10,}|(.)\1{4,}/g.test(entryObject.lure)) {
    return "vieheen nimessä ei voi olla 10 konsonanttia tai 5 samaa merkkia peräkkäin.";
  }

  if (entryObject.place.length > MAX_INPUT_LENGTH_BIG) {
    return `paikan nimi saa olla enintään ${MAX_INPUT_LENGTH_BIG} merkkiä pitkä.`;
  } else if (!/^([^\s]+)+((\s)[^\s]+)*$|^$/.test(entryObject.place)) {
    return "erota paikan nimen osat toisistaan vain yhdellä välilyönnillä.";
  } else if (/[^aeiouyäöAEIOUYÄÖ]{10,}|(.)\1{4,}/g.test(entryObject.place)) {
    return "paikan nimessä ei voi olla 10 konsonanttia tai 5 samaa merkkia peräkkäin.";
  }

  if (entryObject.person.length > MAX_INPUT_LENGTH_SMALL) {
    return `saajan nimi saa olla enintään ${MAX_INPUT_LENGTH_SMALL} merkkiä pitkä.`;
  } else if (!/^([^\s]+)+((\s)[^\s]+)*$/.test(entryObject.person)) {
    return "erota saajan nimen osat toisistaan vain yhdellä välilyönnillä.";
  }

  if (entryObject.fish.length > MAX_INPUT_LENGTH_SMALL) {
    return `kalalajin nimi saa olla enintään ${MAX_INPUT_LENGTH_SMALL} merkkiä pitkä.`;
  } else if (!/^([^\s]+)+((\s)[^\s]+)*$/.test(entryObject.fish)) {
    return "erota kalalajin nimen osat toisistaan vain yhdellä välilyönnillä.";
  }  

  // Ensure that the date is in YYYY-MM-DD format.
  if (!/^[0-9]{4}\-[0-9]{2}\-[0-9]{2}$/.test(entryObject.date)) {
    return 'päivämäärän formaatti virheellinen\nOikea muoto: "vvvv-kk-pp"';
  }

  if (!/^\-?[0-9]{1,2}\.[0-9]{2,10},\s\-?[0-9]{1,3}\.[0-9]{2,10}$|^$/.test(entryObject.coordinates)) {
    return 'koordinaattien formaatti virheellinen\nOikea muoto: "xx.xxxxxxx, yy.yyyyyyy" tai tyhjä\n(huomaa välilyönti)';
  }
}

module.exports = { validateEntryInput }