/*! exificient.js v0.0.2-SNAPSHOT | (c) 2016 Siemens AG | The MIT License (MIT) */

/* TODO How to realize proper error handling */

/*******************************************************************************
 * 
 * S H A R E D - P A R T
 * 
 ******************************************************************************/

function StringTable() {

	this.strings = [];

	function StringTableEntry(namespaceID, localNameID, value, globalValueID, localValueID) {
		this.namespaceID = namespaceID
		this.localNameID = localNameID
		this.value = value
		this.globalValueID = globalValueID;
		this.localValueID = localValueID;
	}

	StringTable.prototype.getNumberOfGlobalStrings = function() {
		return this.strings.length;
	}

	StringTable.prototype.getNumberOfLocalStrings = function(namespaceID, localNameID) {
		var cnt = 0;
		for (var i = 0; i < this.strings.length; i++) {
			if (this.strings[i].namespaceID === namespaceID && this.strings[i].localNameID === localNameID) {
				cnt++;
			}
		}

		return cnt;
	}

	StringTable.prototype.getLocalValue = function(namespaceID, localNameID, localValueID) {
		for (var i = localValueID; i < this.strings.length; i++) {
			if (this.strings[i].namespaceID === namespaceID && this.strings[i].localNameID === localNameID
					&& this.strings[i].localValueID === localValueID) {
				return this.strings[i];
			}
		}

		return null;
	}

	StringTable.prototype.getGlobalValue = function(globalValueID) {
		if (this.strings.length > globalValueID) {
			return this.strings[globalValueID];
		} else {
			return null;
		}
	}

	StringTable.prototype.addValue = function(namespaceID, localNameID, value) {
		var globalValueID = this.strings.length;
		var localValueID = this.getNumberOfLocalStrings(namespaceID, localNameID);
		this.strings.push(new StringTableEntry(namespaceID, localNameID, value, globalValueID,
				localValueID));
	}

	StringTable.prototype.getStringTableEntry = function(value) {
		for (var i = 0; i < this.strings.length; i++) {
			if (this.strings[i].value === value) {
				return this.strings[i];
			}
		}

		return null;
	}
}

Inheritance_Manager = {};// We create an inheritance manager class (the name
// is arbitrary)

Inheritance_Manager.extend = function(subClass, baseClass) {
	function inheritance() {
	}
	inheritance.prototype = baseClass.prototype;
	subClass.prototype = new inheritance();
	subClass.prototype.constructor = subClass;
	subClass.baseConstructor = baseClass;
	subClass.superClass = baseClass.prototype;
}

function AbtractEXICoder(grammars) {

	this.grammars = grammars;
	this.isStrict = true; // TODO

	this.stringTable;
	this.sharedStrings;

	// WARNING: not specified in EXI 1.0 core (is extension)
	AbtractEXICoder.prototype.setSharedStrings = function(sharedStrings) {
		this.sharedStrings = sharedStrings;
		console.log("Set sharedStrings: " + this.sharedStrings);
	}
	
	AbtractEXICoder.prototype.init = function() {
		this.stringTable = new StringTable();
		// console.log("SharedStringsX: " + this.sharedStrings + Object.prototype.toString.call(this.sharedStrings));
		if (this.sharedStrings != null && this.sharedStrings instanceof Array) {
			console.log("SharedStrings: " + this.sharedStrings);
			for (var i = 0; i < this.sharedStrings.length; i++) {
				this.stringTable.addValue(-1, -1, this.sharedStrings[i]);
			}
		}
	}

	// returns the required number of bits for a given number of characteristics
	AbtractEXICoder.prototype.getCodeLength = function(characteristics) {
		if (characteristics < 0) {
			// TODO: set error msg
			throw new Error("Error: Code length for " + characteristics + " not possible");
			return -1;
		} else if (characteristics < 2) {
			// 0 .. 1
			return 0;
		} else if (characteristics < 3) {
			// 2
			return 1;
		} else if (characteristics < 5) {
			// 3 .. 4
			return 2;
		} else if (characteristics < 9) {
			// 5 .. 8
			return 3;
		} else if (characteristics < 17) {
			// 9 .. 16
			return 4;
		} else if (characteristics < 33) {
			// 17 .. 32
			return 5;
		} else if (characteristics < 35) {
			// 33 .. 64
			return 6;
		} else if (characteristics < 129) {
			// 65 .. 128
			return 7;
		} else if (characteristics < 257) {
			// 129 .. 256
			return 8;
		} else if (characteristics < 513) {
			// 257 .. 512
			return 9;
		} else if (characteristics < 1025) {
			// 513 .. 1024
			return 10;
		} else if (characteristics < 2049) {
			// 1025 .. 2048
			return 11;
		} else if (characteristics < 4097) {
			// 2049 .. 4096
			return 12;
		} else if (characteristics < 8193) {
			// 4097 .. 8192
			return 13;
		} else if (characteristics < 16385) {
			// 8193 .. 16384
			return 14;
		} else if (characteristics < 32769) {
			// 16385 .. 32768
			return 15;
		} else {
			return Math.ceil(Math.log(characteristics) / Math.log(2));
		}
	}

	AbtractEXICoder.prototype.getCodeLengthForGrammar = function(grammar) {
		if (grammar.type === "document" || grammar.type === "fragment") {
			return 0;
		} else if (grammar.type === "docContent") {
			// TODO DT, CM, PI
			return this.getCodeLength(grammar.production.length);
		} else if (grammar.type === "docEnd"
				|| grammar.type === "fragmentContent") {
			// TODO CM, PI
			return 0;
		} else if (grammar.type === "firstStartTagContent") {
			if (this.isStrict) {
				return this.getCodeLength(grammar.production.length
						+ ((grammar.isTypeCastable || grammar.isNillable) ? 1
								: 0));
			} else {
				return this.getCodeLength(grammar.production.length + 1);
			}
		} else if (grammar.type === "startTagContent") {
			if (this.isStrict) {
				return this.getCodeLength(grammar.production.length);
			} else {
				return this.getCodeLength(grammar.production.length + 1);
			}
		} else if (grammar.type === "elementContent") {
			if (this.isStrict) {
				return this.getCodeLength(grammar.production.length);
			} else {
				return this.getCodeLength(grammar.production.length + 1);
			}
		} else {
			// unknown grammar type
			throw new Error("Unknown grammar type: " + grammar.type);
			return -1;
		}
	}
}

/*******************************************************************************
 * 
 * D E C O D E R - P A R T
 * 
 ******************************************************************************/

// Define bit stream like a class
function BitInputStream(arrayBuffer) {

	// const
	ERROR_EOF = -3;

	/** array buffer */
	this.uint8Array = new Uint8Array(arrayBuffer);
	/** Current byte buffer */
	this.buffer = 0;
	/** Remaining bit capacity in current byte buffer */
	this.capacity = 0;
	/** byte array next position in array */
	this.pos = 0;
	/** error flag */
	this.errn = 0;

	/**
	 * If buffer is empty, read byte from underlying byte array
	 */
	BitInputStream.prototype.readBuffer = function() {
		if (this.capacity === 0) {
			if (this.uint8Array.length > this.pos) {
				this.buffer = this.uint8Array[this.pos++];
				this.capacity = 8; // bits
			} else {
				this.errn = ERROR_EOF; // EOF
			}
		}
	}

	/**
	 * Decodes and returns an n-bit unsigned integer.
	 */
	BitInputStream.prototype.decodeNBitUnsignedInteger = function(nbits) {
		if (nbits < 0) {
			throw new Error("Error in decodeNBitUnsignedInteger, nbits = " + nbits);
			this.errn = -1;
			return -1;
		} else if (nbits === 0) {
			return 0;
		} else {
			// check buffer
			this.readBuffer();

			// read bits
			if (this.errn === 0) {
				if (nbits <= this.capacity) {
					/* read the bits in one step */
					this.capacity = this.capacity - nbits;
					var b = (this.buffer >> this.capacity)
							& (0xff >> (8 - nbits));
					return b;
				} else if (this.capacity === 0 && nbits === 8) {
					/* possible to read direct byte, nothing else to do */
					return this.uint8Array[this.pos];
				} else {
					/* read bits as much as possible */
					var b = this.buffer & (0xff >> (8 - this.capacity));
					nbits = nbits - this.capacity;
					this.capacity = 0;

					/* read whole bytes */
					while (this.errn === 0 && nbits >= 8) {
						this.readBuffer();
						b = (b << 8) | this.buffer;
						nbits = nbits - 8;
						this.capacity = 0;
					}

					/* read the spare bits in the buffer */
					if (this.errn === 0 && nbits > 0) {
						this.readBuffer();
						if (this.errn === 0) {
							b = (b << nbits) | (this.buffer >> (8 - nbits));
							this.capacity = 8 - nbits;
						}
					}

					return b;
				}
			}
		}

		return -1;
	}

	/**
	 * Decode an arbitrary precision non negative integer using a sequence of
	 * octets. The most significant bit of the last octet is set to zero to
	 * indicate sequence termination. Only seven bits per octet are used to
	 * store the integer's value.
	 */
	BitInputStream.prototype.decodeUnsignedInteger = function() {
		// 0XXXXXXX ... 1XXXXXXX 1XXXXXXX
		
        var intVal = 0;
        var mul = 1;
        var val = this.decodeNBitUnsignedInteger(8);
        while (val >= 128) {
            intVal = intVal + mul * (val - 128);
            val = this.decodeNBitUnsignedInteger(8);
            mul = mul * 128;
        }
        intVal = intVal + (mul * val);
        return intVal;
        
		/*
		var result = this.decodeNBitUnsignedInteger(8);

		// < 128: just one byte, optimal case
		// ELSE: multiple bytes...

		if (result >= 128) {
			result = (result & 127);
			var mShift = 7;
			var b;

			do {
				// 1. Read the next octet
				b = this.decodeNBitUnsignedInteger(8);
				// 2. Multiply the value of the unsigned number represented by
				// the 7 least significant
				// bits of the octet by the current multiplier and add the
				// result to the current value.
				result += (b & 127) << mShift;
				// 3. Multiply the multiplier by 128
				mShift += 7;
				// 4. If the most significant bit of the octet was 1, go back to
				// step 1
			} while (b >= 128);
		}
		

		return result;
		*/
	}

	/**
	 * Decode an arbitrary precision integer using a sign bit followed by a
	 * sequence of octets. The most significant bit of the last octet is set to
	 * zero to indicate sequence termination. Only seven bits per octet are used
	 * to store the integer's value.
	 */
	BitInputStream.prototype.decodeInteger = function() {
		if (this.decodeNBitUnsignedInteger(1) === 0) {
			// positive
			return this.decodeUnsignedInteger();
		} else {
			// For negative values, the Unsigned Integer holds the
			// magnitude of the value minus 1
			return (-(this.decodeUnsignedInteger() + 1));
		}
	}

	/**
	 * Decode the characters of a string whose length (#code-points) has already
	 * been read.
	 * 
	 * @return The character sequence as a string.
	 */
	BitInputStream.prototype.decodeStringOnly = function(length) {
		var s = "";
		var i;
		for (i = 0; i < length; i++) {
			var codePoint = this.decodeUnsignedInteger();
			s += String.fromCharCode(codePoint);
		}

		return s;
	}
}

Inheritance_Manager.extend(EXIDecoder, AbtractEXICoder);

// arrayBuffer EXI ArrayBuffer
// grammars JSON
function EXIDecoder(grammars) {

	EXIDecoder.baseConstructor.call(this, grammars);

	this.bitStream;

	this.eventHandler = [];

	EXIDecoder.prototype.registerEventHandler = function(handler) {
		this.eventHandler.push(handler);
	}

	EXIDecoder.prototype.decodeHeader = function() {
		// TODO cookie
		var distBits = this.bitStream.decodeNBitUnsignedInteger(2); // Distinguishing
		// Bits
		if (distBits != 2) {
			throw new Error("Distinguishing Bits are " + distBits);
			return -1;
		}
		var presBit = this.bitStream.decodeNBitUnsignedInteger(1); // Presence
		// Bit for
		// EXI
		// Options
		if (presBit != 0) {
			throw new Error("Do not support EXI Options in header");
			return -1;
		}
		// TODO continuos e.g., Final version 16 == 0 1111 0000
		var formatVersion = this.bitStream.decodeNBitUnsignedInteger(5); // Format
		// Version
		if (formatVersion != 0) {
			throw new Error("Do not support format version " + formatVersion);
			return -1;
		}

		return 0;
	}

	EXIDecoder.prototype.decodeDatatypeValue = function(datatype, namespaceID, localNameID,
			isCharactersEvent) {
		// Note: qnameContext == null --> CHARACTERS event
		if (datatype.type === "STRING") {
			this.decodeDatatypeValueString(namespaceID, localNameID, isCharactersEvent);
		} else if (datatype.type === "UNSIGNED_INTEGER") {
			this.decodeDatatypeValueUnsignedInteger(namespaceID, localNameID, isCharactersEvent);
		} else if (datatype.type === "INTEGER") {
			this.decodeDatatypeValueInteger(namespaceID, localNameID, isCharactersEvent);
		} else if (datatype.type === "FLOAT") {
			this.decodeDatatypeValueFloat(namespaceID, localNameID, isCharactersEvent);
		} else if (datatype.type === "BOOLEAN") {
			this.decodeDatatypeValueBoolean(namespaceID, localNameID, isCharactersEvent);
		} else if (datatype.type === "DATETIME") {
			this.decodeDatatypeValueDateTime(datatype.datetimeType, namespaceID, localNameID, isCharactersEvent);
		} else if (datatype.type === "LIST") {
			var sList = "";
			var listLength = this.bitStream.decodeUnsignedInteger();
			console.log("\t" + " LIST with length " + listLength );
			
			for (var i = 0; i < this.eventHandler.length; i++) {
				var eh = this.eventHandler[i];
				if (isCharactersEvent) {
					// eh.characters(sList);
					
					for(var i=0; i < listLength; i++) {
						if (datatype.listType === "STRING") {
							this.decodeDatatypeValueString(namespaceID, localNameID, true);
							eh.characters(" ");
						} else if (datatype.listType === "UNSIGNED_INTEGER") {
							this.decodeDatatypeValueUnsignedInteger(namespaceID, localNameID, true);
							eh.characters(" ");
						} else if (datatype.listType === "INTEGER") {
							this.decodeDatatypeValueInteger(namespaceID, localNameID, true);
							eh.characters(" ");
						} else if (datatype.listType === "FLOAT") {
							this.decodeDatatypeValueFloat(namespaceID, localNameID, true);
							eh.characters(" ");
						} else if (datatype.listType === "BOOLEAN") {
							this.decodeDatatypeValueBoolean(namespaceID, localNameID, true);
							eh.characters(" ");
						} else {
							throw new Error("Unsupported list datatype: " + datatype.listType + " for value " + value );
						}		
					}
				} else {
					// Note: we need to change the process so that a values is returned instead!!
					throw new Error("Unsupported LIST datatype attribute!!");
					
					// var namespaceContext = this.grammars.qnames.namespaceContext[namespaceID];
					// var qnameContext = namespaceContext.qnameContext[localNameID];
					// eh.attribute(namespaceContext.uri, qnameContext.localName, sList);
				}
			}
			
		} else {
			throw new Error("Unsupported datatype: " + datatype.type);
		}
	}
	
	EXIDecoder.prototype.decodeDatatypeValueString = function(namespaceID, localNameID, isCharactersEvent) {
		var s;
		var i = this.bitStream.decodeUnsignedInteger();
		// console.log("\t" + " String i: " + i );
		switch (i) {
		case 0:
			/* local value hit */
			var n = this.getCodeLength(this.stringTable
					.getNumberOfLocalStrings(namespaceID, localNameID));
			var localID = this.bitStream.decodeNBitUnsignedInteger(n);
			var lhit = this.stringTable.getLocalValue(namespaceID, localNameID, localID);
			console.log("\t" + " String localValue hit '" + lhit.value
					+ "'");
			s = lhit.value;
			break;
		case 1:
			/* global value hit */
			var n = this.getCodeLength(this.stringTable
					.getNumberOfGlobalStrings());
			var globalID = this.bitStream.decodeNBitUnsignedInteger(n);
			var ghit = this.stringTable.getGlobalValue(globalID);
			console.log("\t" + " String globalValue hit '" + ghit.value
					+ "'");
			s = ghit.value;
			break;
		default:
			// not found in global value (and local value) partition
			// ==> string literal is encoded as a String with the length
			// incremented by two.
			i = i - 2;
			if (i === 0) {
				// empty string
				console.log("\t" + " String is empty string ''");
				s = "";
			} else {
				s = this.bitStream.decodeStringOnly(i);
				console.log("\t" + " String = " + s);
				this.stringTable.addValue(namespaceID, localNameID, s);
			}
			break;
		}
		for (var i = 0; i < this.eventHandler.length; i++) {
			var eh = this.eventHandler[i];
			if (isCharactersEvent) {
				eh.characters(s);
			} else {
				var namespaceContext = this.grammars.qnames.namespaceContext[namespaceID];
				var qnameContext = namespaceContext.qnameContext[localNameID];
				eh.attribute(namespaceContext.uri, qnameContext.localName, s);
			}
		}
	}
	
	EXIDecoder.prototype.decodeDatatypeValueUnsignedInteger = function(namespaceID, localNameID, isCharactersEvent) {
		var uint = this.bitStream.decodeUnsignedInteger();
		console.log("\t" + " UNSIGNED_INTEGER = " + uint);
		for (i = 0; i < this.eventHandler.length; i++) {
			var eh = this.eventHandler[i];
			if (isCharactersEvent) {
				eh.characters(uint);
			} else {
				var namespaceContext = this.grammars.qnames.namespaceContext[namespaceID];
				var qnameContext = namespaceContext.qnameContext[localNameID];
				eh.attribute(namespaceContext.uri, qnameContext.localName, uint);
			}
		}
	}
	
	EXIDecoder.prototype.decodeDatatypeValueInteger = function(namespaceID, localNameID, isCharactersEvent) {
		var int = this.bitStream.decodeInteger();
		console.log("\t" + " INTEGER = " + int);
		var i;
		for (i = 0; i < this.eventHandler.length; i++) {
			var eh = this.eventHandler[i];
			if (isCharactersEvent) {
				eh.characters(int);
			} else {
				var namespaceContext = this.grammars.qnames.namespaceContext[namespaceID];
				var qnameContext = namespaceContext.qnameContext[localNameID];
				eh.attribute(namespaceContext.uri, qnameContext.localName, int);
			}
		}
	}
	
	EXIDecoder.prototype.decodeDatatypeValueFloat = function(namespaceID, localNameID, isCharactersEvent) {
		var mantissa = this.bitStream.decodeInteger();
		var exponent = this.bitStream.decodeInteger();
		console.log("\t" + " float = " + mantissa + "E" + exponent);
		var i;
		for (i = 0; i < this.eventHandler.length; i++) {
			var eh = this.eventHandler[i];
			if (isCharactersEvent) {
				eh.characters(mantissa + "E" + exponent);
			} else {
				var namespaceContext = this.grammars.qnames.namespaceContext[namespaceID];
				var qnameContext = namespaceContext.qnameContext[localNameID];
				eh.attribute(namespaceContext.uri, qnameContext.localName, mantissa + "E"
						+ exponent);
			}
		}
	}
	
	EXIDecoder.prototype.decodeDatatypeValueBoolean = function(namespaceID, localNameID, isCharactersEvent) {
		var b = this.bitStream.decodeNBitUnsignedInteger(1) === 0 ? false
				: true;
		console.log("\t" + " boolean = " + b);
		for (var i = 0; i < this.eventHandler.length; i++) {
			var eh = this.eventHandler[i];
			if (isCharactersEvent) {
				eh.characters(b);
			} else {
				var namespaceContext = this.grammars.qnames.namespaceContext[namespaceID];
				var qnameContext = namespaceContext.qnameContext[localNameID];
				eh.attribute(namespaceContext.uri, qnameContext.localName, b);
			}
		}
	}

	
	
	EXIDecoder.prototype.decodeDatatypeValueDateTime = function(datetimeType, namespaceID, localNameID, isCharactersEvent) {
		var year = 0, monthDay = 0, time = 0, fractionalSecs = 0;
		var presenceFractionalSecs = false;
		var sDatetime = "";
		if (datetimeType === "date"
		// || datatype.datetimeType == "gYearMonth"
		) {
			// YEAR_OFFSET = 2000
			// NUMBER_BITS_MONTHDAY = 9
			// MONTH_MULTIPLICATOR = 32
			year = this.bitStream.decodeInteger() + 2000;
			sDatetime += year;
			monthDay = this.bitStream.decodeNBitUnsignedInteger(9);
			var month = Math.floor(monthDay / 32);
			if (month < 10) {
				sDatetime += "-0" + month;
			} else {
				sDatetime += "-" + month;
			}
			var day = monthDay - (month * 32);
			sDatetime += "-" + day;
		} else {
			throw new Error("Unsupported datetime type: " + datetimeType);
		}
		var presenceTimezone = this.bitStream.decodeNBitUnsignedInteger(1) === 0 ? false
				: true;
		// console.log("\t" + " presenceTimezone = " + presenceTimezone);
		if (presenceTimezone) {
			var timeZone = this.bitStream.decodeNBitUnsignedInteger(11) - 896;
		}

		console.log("\t" + " datetime = " + sDatetime);
		for (var i = 0; i < this.eventHandler.length; i++) {
			var eh = this.eventHandler[i];
			if (isCharactersEvent) {
				eh.characters(sDatetime);
			} else {
				var namespaceContext = this.grammars.qnames.namespaceContext[namespaceID];
				var qnameContext = namespaceContext.qnameContext[localNameID];
				eh.attribute(namespaceContext.uri, qnameContext.localName, sDatetime);
			}
		}
	}
	
	
	EXIDecoder.prototype.decodeElementContext = function(grammar, elementNamespaceID, elementLocalNameID) {

		var popStack = false;

		while (!popStack) {

			var codeLength = this.getCodeLengthForGrammar(grammar);

			var ec = this.bitStream.decodeNBitUnsignedInteger(codeLength); //
			// console.log("\t" + "Event Code == " + ec );
			var prod = grammar.production[ec];

			// console.log("\t" + "Event Production " + prod.event);

			switch (prod.event) {
			case "startDocument":
				console.log("> SD");
				var i;
				for (i = 0; i < this.eventHandler.length; i++) {
					var eh = this.eventHandler[i];
					eh.startDocument();
				}
				break;
			case "endDocument":
				console.log("< ED");
				var i;
				for (i = 0; i < this.eventHandler.length; i++) {
					var eh = this.eventHandler[i];
					eh.endDocument();
				}
				popStack = true;
				break;
			case "startElement":
				// console.log("\t" + "StartElement qnameID " +
				// prod.startElementQNameID );
				// console.log("\t" + "StartElement name " +
				// getQNameContext(prod.startElementQNameID).localName);

				var seGrammar = grammars.grs.grammar[prod.startElementGrammarID];
				var namespaceContext = this.grammars.qnames.namespaceContext[prod.startElementNamespaceID];
				var qnameContext = namespaceContext.qnameContext[prod.startElementLocalNameID];
				console.log(">> SE (" + qnameContext.localName + ")");
				var i;
				for (i = 0; i < this.eventHandler.length; i++) {
					var eh = this.eventHandler[i];
					eh.startElement(namespaceContext.uri, qnameContext.localName);
				}

				this.decodeElementContext(seGrammar, prod.startElementNamespaceID, prod.startElementLocalNameID);
				break;
			case "endElement":
				var namespaceContextEE = this.grammars.qnames.namespaceContext[elementNamespaceID];
				var qnameContextEE = namespaceContextEE.qnameContext[elementLocalNameID];
				console.log("<< EE (" + qnameContextEE.localName + ")");
				var i;
				for (i = 0; i < this.eventHandler.length; i++) {
					var eh = this.eventHandler[i];
					eh.endElement(namespaceContextEE.uri, qnameContextEE.localName);
				}
				popStack = true;
				break;
			case "attribute":
				// console.log("\t" + "Attribute qnameID " +
				// prod.attributeQNameID );
				// console.log("\t" + "Attribute name " +
				// getQNameContext(prod.attributeQNameID).localName);
				// console.log("\t" + "Attribute datatypeID " +
				// prod.attributeDatatypeID );

				var datatype = this.grammars.simpleDatatypes[prod.attributeDatatypeID];
				// console.log("\t" + "Attribute datatype " + datatype );
				var namespaceContextA = this.grammars.qnames.namespaceContext[prod.attributeNamespaceID];
				var qnameContextA = namespaceContextA.qnameContext[prod.attributeLocalNameID];
				console.log("\t" + "AT (" + qnameContextA.localName + ")");

				this.decodeDatatypeValue(datatype, prod.attributeNamespaceID, prod.attributeLocalNameID, false);

				break;
			case "characters":
				// console.log("\t" + "Characters datatypeID " +
				// prod.charactersDatatypeID );
				var datatype = this.grammars.simpleDatatypes[prod.charactersDatatypeID];
				// console.log("\t" + "Characters datatype " + datatype );
				console.log("\t" + "CH");
				this.decodeDatatypeValue(datatype, elementNamespaceID, elementLocalNameID, true);
				break;
			default:
				console.log("\t" + "Unknown event " + prod.event);
				throw new Error("Unknown event " + prod.event);
				// TODO error!
				popStack = true;
			}

			// console.log("\t" + "Event NextGrammarId " + prod.nextGrammarID);
			grammar = grammars.grs.grammar[prod.nextGrammarID];

		}

	}

	EXIDecoder.prototype.decode = function(arrayBuffer) {
		this.init();
		
		this.bitStream = new BitInputStream(arrayBuffer)

		console.log("JSON Grammars: " + grammars);
		console.log("\t" + "Number of NamespaceContexts"
				+ Object.keys(grammars.qnames.namespaceContext).length);
		// console.log("\t" + grammars.uris);

		console.log("\t" + "numberOfUris:  " + grammars.qnames.numberOfUris);
		console.log("\t" + "numberOfQNames:" + grammars.qnames.numberOfQNames);

		console.log("EXI: " + arrayBuffer + " len=" + arrayBuffer.byteLength);

		
		
		// process header
		var errn = this.decodeHeader();

		if (errn === 0) {
			// process EXI body

			// Document grammar
			console.log("\t" + "number of grammars: "
					+ grammars.grs.grammar.length);
			console.log("\t" + "Document grammar ID: "
					+ grammars.grs.documentGrammarID);
			var docGr = grammars.grs.grammar[grammars.grs.documentGrammarID];

			this.decodeElementContext(docGr, -1);
		}

		return errn;
	}

}

/* allows to retrieve XML by registering it as decoder handler */
function XMLEventHandler() {

	this.xml;
	this.seOpen = false;

	XMLEventHandler.prototype.getXML = function() {
		return this.xml;
	}

	XMLEventHandler.prototype.startDocument = function() {
		this.xml = "";
	}
	XMLEventHandler.prototype.endDocument = function() {
	}
	XMLEventHandler.prototype.startElement = function(namespace, localName) {
		if (this.seOpen) {
			this.xml += ">";
		}
		this.xml += "<" + localName;
		this.seOpen = true;
	}
	XMLEventHandler.prototype.endElement = function(namespace, localName) {
		if (this.seOpen) {
			this.xml += ">";
			this.seOpen = false;
		}
		this.xml += "</" + localName + ">";
	}
	XMLEventHandler.prototype.characters = function(chars) {
		if (this.seOpen) {
			this.xml += ">";
			this.seOpen = false;
		}
		this.xml += chars;
	}
	XMLEventHandler.prototype.attribute = function(namespace, localName, value) {
		this.xml += " " + localName + "=\"" + value + "\"";
	}
}

/*******************************************************************************
 * 
 * E N C O D E R - P A R T
 * 
 ******************************************************************************/

function BitOutputStream() {
	/** array buffer */
	this.uint8Array = new Uint8Array(8); // initial size
	/** Current byte buffer */
	this.buffer = 0;
	/** Remaining bit capacity in current byte buffer */
	this.capacity = 8;
	/** Fully-written bytes */
	this.len = 0;
	/** error flag */
	this.errn = 0;

	/* internal: increases buffer if array is not sufficient anymore */
	BitOutputStream.prototype.checkBuffer = function() {
		if (this.len >= this.uint8Array.length) {
			// double size
			var uint8ArrayNew = new Uint8Array(this.uint8Array.length * 2);
			// copy (TODO is there a better way?)
			for (var i = 0; i < this.uint8Array.length; i++) {
				uint8ArrayNew[i] = this.uint8Array[i];
			}
			this.uint8Array = uint8ArrayNew;
		}
	}

	BitOutputStream.prototype.getUint8Array = function() {
		return this.uint8Array;
	}
	BitOutputStream.prototype.getUint8ArrayLength = function() {
		return this.len;
	}

	/**
	 * If there are some unwritten bits, pad them if necessary and write them
	 * out.
	 */
	BitOutputStream.prototype.align = function() {
		if (this.capacity < 8) {
			this.checkBuffer();
			this.uint8Array[this.len] = this.buffer << this.capacity;
			this.capacity = 8;
			this.buffer = 0;
			this.len++;
		}
	}

	/**
	 * Encode n-bit unsigned integer. The n least significant bits of parameter
	 * b starting with the most significant, i.e. from left to right.
	 */
	BitOutputStream.prototype.encodeNBitUnsignedInteger = function(b, n) {
		if (n === 0) {
			// nothing to write
		} else if (n <= this.capacity) {
			// all bits fit into the current buffer
			this.buffer = (this.buffer << n) | (b & (0xff >> (8 - n)));
			this.capacity -= n;
			if (this.capacity === 0) {
				this.checkBuffer();
				this.uint8Array[this.len] = this.buffer;
				this.capacity = 8;
				this.len++;
			}
		} else {
			// fill as many bits into buffer as possible
			this.buffer = (this.buffer << this.capacity)
					| ((b >>> (n - this.capacity)) & (0xff >> (8 - this.capacity)));
			n -= this.capacity;
			this.checkBuffer();
			this.uint8Array[this.len] = this.buffer;
			this.len++;

			// possibly write whole bytes
			while (n >= 8) {
				n -= 8;
				this.checkBuffer();
				this.uint8Array[this.len] = b >>> n;
				this.len++;
			}

			// put the rest of bits into the buffer
			this.buffer = b; // Note: the high bits will be shifted out
			// during
			// further filling
			this.capacity = 8 - n;
		}
	}

	/**
	 * Returns the least number of 7 bit-blocks that is needed to represent the
	 * int <param>n</param>. Returns 1 if <param>n</param> is 0.
	 * 
	 * @param n
	 *            integer value
	 * 
	 */
	BitOutputStream.prototype.numberOf7BitBlocksToRepresent = function(n) {
		/* assert (n >= 0); */
		/* 7 bits */
		if (n < 128) {
			return 1;
		}
		/* 14 bits */
		else if (n < 16384) {
			return 2;
		}
		/* 21 bits */
		else if (n < 2097152) {
			return 3;
		}
		/* 28 bits */
		else if (n < 268435456) {
			return 4;
		}
		/* 35 bits */
		else if (n < 0x800000000) {
			return 5;
		}
		/* 42 bits */
		else if (n < 0x40000000000) {
			return 6;
		}
		/* 49 bits */
		else if (n < 0x2000000000000) {
			return 7;
		}
		/* 56 bits */
		else if (n < 0x100000000000000) {
			return 8;
		}
		/* 63 bits */
		else if (n < 0x8000000000000000) {
			return 9;
		}
		/* 70 bits */
		else {
			// long, 64 bits
			return 10;
		}
	}

	/**
	 * Encode an arbitrary precision non negative integer using a sequence of
	 * octets. The most significant bit of the last octet is set to zero to
	 * indicate sequence termination. Only seven bits per octet are used to
	 * store the integer's value.
	 */
	BitOutputStream.prototype.encodeUnsignedInteger = function(n) {
		if (n < 128) {
			// write value as is
			this.encodeNBitUnsignedInteger(n, 8);
		} else {
			var n7BitBlocks = this.numberOf7BitBlocksToRepresent(n);

			switch (n7BitBlocks) {
			case 10:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 9:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 8:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 7:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 6:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 5:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 4:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 3:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 2:
				this.encodeNBitUnsignedInteger(128 | n, 8);
				n = n >>> 7;
			case 1:
				// 0 .. 7 (last byte)
				this.encodeNBitUnsignedInteger(0 | n, 8);
			}
		}
	}

	/**
	 * Encode an arbitrary precision integer using a sign bit followed by a
	 * sequence of octets. The most significant bit of the last octet is set to
	 * zero to indicate sequence termination. Only seven bits per octet are used
	 * to store the integer's value.
	 */
	BitOutputStream.prototype.encodeInteger = function(n) {
		// signalize sign
		if (n < 0) {
			this.encodeNBitUnsignedInteger(1, 1);
			// For negative values, the Unsigned Integer holds the
			// magnitude of the value minus 1
			this.encodeUnsignedInteger((-n) - 1);
		} else {
			this.encodeNBitUnsignedInteger(0, 1);
			this.encodeUnsignedInteger(n);
		}
	}

	/**
	 * Encode a string as a sequence of codepoints, each of which is encoded as
	 * an unsigned integer.
	 */
	BitOutputStream.prototype.encodeStringOnly = function(str) {
		// str.charCodeAt(0); // Return the Unicode of character in a string

		for (var i = 0; i < str.length; i++) {
			var cp = str.charCodeAt(i);
			this.encodeUnsignedInteger(cp);
		}
	}

}

Inheritance_Manager.extend(EXIEncoder, AbtractEXICoder);

// grammars JSON
function EXIEncoder(grammars) {

	EXIEncoder.baseConstructor.call(this, grammars);

	this.bitStream;
	this.elementContext;

	function ElementContextEntry(namespaceID, localNameID, grammar) {
		this.namespaceID = namespaceID;
		this.localNameID = localNameID;
		this.grammar = grammar;
	}

	EXIEncoder.prototype.encodeXmlText = function(textXML) {
		/*
		 * should allow parsing XML string into an XML document in all major
		 * browsers, including Internet Explorer 6 and Java Nashorn.
		 */
		var xmlDoc;
		if (typeof window !== 'undefined' && typeof window.DOMParser != "undefined") {
			var parseXml = function(xmlStr) {
				return (new window.DOMParser()).parseFromString(xmlStr,
						"text/xml");
			};
			xmlDoc = parseXml(textXML);
		} else if (typeof window !== 'undefined' && typeof window.ActiveXObject != "undefined"
				&& new window.ActiveXObject("Microsoft.XMLDOM")) {
			var parseXml = function(xmlStr) {
				var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
				xmlDoc.async = "false";
				xmlDoc.loadXML(xmlStr);
				return xmlDoc;
			};
			xmlDoc = parseXml(textXML);
		} else if (typeof javax.xml.parsers.DocumentBuilderFactory != "undefined" ) {
            var factory = javax.xml.parsers.DocumentBuilderFactory.newInstance();
            factory.setNamespaceAware(true);
            var documentBuilder = factory.newDocumentBuilder();
            xmlDoc = documentBuilder.parse(new org.xml.sax.InputSource(new java.io.StringReader(textXML)));
            /* return doc; */
		} else {
			throw new Error("No XML parser found");
		}
		
		this.encodeXmlDocument(xmlDoc);
	}

	EXIEncoder.prototype.encodeXmlDocument = function(xmlDoc) {		
		this.startDocument();
		// documentElement always represents the root node
		this.processXMLElement(xmlDoc.documentElement);
		this.endDocument();
	}

	EXIEncoder.prototype.encodeHeader = function() {
		// TODO cookie

		// Distinguishing Bits 10
		this.bitStream.encodeNBitUnsignedInteger(2, 2);
		// Presence Bit for EXI Options 0
		this.bitStream.encodeNBitUnsignedInteger(0, 1);
		// EXI Format Version 0-0000
		this.bitStream.encodeNBitUnsignedInteger(0, 1); // preview false
		this.bitStream.encodeNBitUnsignedInteger(0, 4);

		return 0;
	}

	EXIEncoder.prototype.processXMLElement = function(el) {
		// console.log("SE " + el.nodeName);
		this.startElement(el.namespaceURI, el.localName);

		if (el.attributes != null && el.attributes.length > 0) {
			if (el.attributes.length > 1) {
				// sorting
				var atts = [];
				for (var i = 0; i < el.attributes.length; i++) {
					// console.log(" AT " + el.attributes[i].nodeName + " == " +
					// el.attributes[i].nodeValue);
					var at = el.attributes.item(i);
					atts.push(at.localName);

				}
				// sort according localName
				// TODO in case also for namespace URI
				atts.sort();
				// write in sorted order
				for (var i = 0; i < atts.length; i++) {
					var at = el.getAttributeNode(atts[i]);
					if (at != null) {
						this.attribute(at.namespaceURI, at.localName,
								at.nodeValue);
					} else {
						// when does this happen, only for schemaLocations and
						// such?
					}
				}
			} else {
				// console.log("AT length: " + el.attributes.length);
				// console.log("AT all: " + el.attributes);
				// console.log("AT1 " + el.attributes.item(0));
				var at1 = el.attributes.item(0);
				// console.log("AT2 " + el.attributes[0]);
				this.attribute(at1.namespaceURI, at1.localName, at1.nodeValue);
			}
		}

		var childNodes = el.childNodes;
		// console.log("\tchildNodes.length" + childNodes.length);
		for (var i = 0; i < childNodes.length; i++) {
			// Attributes (type 1)
			// Text (type 3)
			var cn = childNodes.item(i);
			if (cn.nodeType === 3) {
				var text = cn.nodeValue;
				text = text.trim();
				if (text.length > 0) {
					// console.log(" Text '" + text + "'");
					this.characters(text);
				}
			}

			// Process only element nodes (type 1) further
			if (cn.nodeType === 1) {
				this.processXMLElement(cn);
				// console.log(childNodes[i].childNodes[0].nodeValue);
			}
		}

		// console.log("EE " + el.nodeName);
		this.endElement();
	}

	EXIEncoder.prototype.getUint8Array = function() {
		return this.bitStream.getUint8Array();
	}
	EXIEncoder.prototype.getUint8ArrayLength = function() {
		return this.bitStream.getUint8ArrayLength();
	}

	EXIEncoder.prototype.startDocument = function() {
		this.init();
		this.bitStream = new BitOutputStream();
		this.elementContext = [];
		
		this.encodeHeader();
		// set grammar position et cetera

		// Document grammar
		console
				.log("\t" + "number of grammars: "
						+ grammars.grs.grammar.length);
		console.log("\t" + "Document grammar ID: "
				+ grammars.grs.documentGrammarID);
		var docGr = grammars.grs.grammar[grammars.grs.documentGrammarID];

		var ec = -1;
		var prod;
		for (var i = 0; ec === -1 && i < docGr.production.length; i++) {
			prod = docGr.production[i];
			if (prod.event === "startDocument") {
				ec = i;
			}
		}
		if (ec != -1) {
			// console.log("\t" + "Event Code == " + ec );
			var codeLength = this.getCodeLengthForGrammar(docGr);
			this.bitStream.encodeNBitUnsignedInteger(ec, codeLength);

			var nextGrammar = grammars.grs.grammar[prod.nextGrammarID];
			this.elementContext.push(new ElementContextEntry(-1, -1, nextGrammar));
		} else {
			throw new Error("No startDocument event found");
		}
	}

	EXIEncoder.prototype.endDocument = function() {
		var ec = -1;
		var prod;
		var grammar = this.elementContext[this.elementContext.length - 1].grammar;
		for (var i = 0; ec === -1 && i < grammar.production.length; i++) {
			prod = grammar.production[i];
			if (prod.event === "endDocument") {
				ec = i;
			}
		}
		if (ec != -1) {
			// console.log("\t" + "Event Code == " + ec );
			var codeLength = this.getCodeLengthForGrammar(grammar);
			this.bitStream.encodeNBitUnsignedInteger(ec, codeLength);

			// pop element stack
			this.elementContext.pop();
		} else {
			throw new Error("No endDocument event found");
		}

		if (this.elementContext.length != 0) {
			throw new Error("Element context not balanced");
		}

		this.bitStream.align();
	}

	EXIEncoder.prototype.startElement = function(namespace, localName) {
		if (namespace === null) {
			namespace = "";
		}
		console.log("SE {" + namespace + "}" + localName);

		var ec = -1;
		var prod;
		var grammar = this.elementContext[this.elementContext.length - 1].grammar;
		for (var i = 0; ec === -1 && i < grammar.production.length; i++) {
			prod = grammar.production[i];
			if (prod.event === "startElement") {
				var namespaceContext = this.grammars.qnames.namespaceContext[prod.startElementNamespaceID];
				var qnameContext = namespaceContext.qnameContext[prod.startElementLocalNameID];
				if (qnameContext.localName === localName && namespaceContext.uri === namespace) {
					ec = i;
				}
			}
		}
		if (ec != -1) {
			// console.log("\t" + "Event Code == " + ec );
			var codeLength = this.getCodeLengthForGrammar(grammar);
			this.bitStream.encodeNBitUnsignedInteger(ec, codeLength);

			// update current element context
			var nextGrammar = grammars.grs.grammar[prod.nextGrammarID];
			this.elementContext[this.elementContext.length - 1].grammar = nextGrammar;
			// push new element context
			var startElementGrammar = grammars.grs.grammar[prod.startElementGrammarID];
			this.elementContext.push(new ElementContextEntry(
					prod.startElementNamespaceID, prod.startElementLocalNameID, startElementGrammar));
		} else {
			throw new Error("No startElement event found for " + localName);
		}
	}

	EXIEncoder.prototype.endElement = function() {
		console.log("EE");

		var ec = -1;
		var prod;
		var grammar = this.elementContext[this.elementContext.length - 1].grammar;
		for (var i = 0; ec === -1 && i < grammar.production.length; i++) {
			prod = grammar.production[i];
			if (prod.event === "endElement") {
				ec = i;
			}
		}
		if (ec != -1) {
			// console.log("\t" + "Event Code == " + ec );
			var codeLength = this.getCodeLengthForGrammar(grammar);
			this.bitStream.encodeNBitUnsignedInteger(ec, codeLength);

			// pop element stack
			this.elementContext.pop();
		} else {
			throw new Error("No endElement event found");
		}
	}

	EXIEncoder.prototype.attribute = function(namespace, localName, value) {
		if (namespace === null) {
			namespace = "";
		}
		console.log("\tAT {" + namespace + "}" + localName + " == '" + value
				+ "'");
		if ("http://www.w3.org/2000/xmlns/" === namespace) {
			// TODO namespace declaration
		} else if ("http://www.w3.org/2001/XMLSchema-instance" === namespace) {
			// TODO schemaLocation et cetera
		} else {
			// normal attribute
			var ec = -1;
			var prod;
			var grammar = this.elementContext[this.elementContext.length - 1].grammar;
			for (var i = 0; ec === -1 && i < grammar.production.length; i++) {
				prod = grammar.production[i];
				if (prod.event === "attribute") {
					var namespaceContext = this.grammars.qnames.namespaceContext[prod.attributeNamespaceID];
					var qnameContext = namespaceContext.qnameContext[prod.attributeLocalNameID];
					if (qnameContext.localName === localName && namespaceContext.uri === namespace) {
						ec = i;
					}
				}
			}
			if (ec != -1) {
				// console.log("\t" + "Event Code == " + ec );
				var codeLength = this.getCodeLengthForGrammar(grammar);
				this.bitStream.encodeNBitUnsignedInteger(ec, codeLength);
				// write value
				var datatype = this.grammars.simpleDatatypes[prod.attributeDatatypeID];
				this
						.encodeDatatypeValue(value, datatype,
								prod.attributeNamespaceID, prod.attributeLocalNameID);
				// update current element context with revised grammar
				var nextGrammar = grammars.grs.grammar[prod.nextGrammarID];
				this.elementContext[this.elementContext.length - 1].grammar = nextGrammar;
			} else {
				throw new Error("No attribute event found for " + localName);
			}
		}
	}

	EXIEncoder.prototype.characters = function(chars) {
		console.log("\tCharacters '" + chars + "'");

		var ec = -1;
		var prod;
		var grammar = this.elementContext[this.elementContext.length - 1].grammar;
		for (var i = 0; ec === -1 && i < grammar.production.length; i++) {
			prod = grammar.production[i];
			if (prod.event === "characters") {
				ec = i;
			}
		}
		if (ec != -1) {
			// console.log("\t" + "Event Code == " + ec );
			var codeLength = this.getCodeLengthForGrammar(grammar);
			this.bitStream.encodeNBitUnsignedInteger(ec, codeLength);
			// write value
			var datatype = this.grammars.simpleDatatypes[prod.charactersDatatypeID];
			var elementContext = this.elementContext[this.elementContext.length - 1];
			this
					.encodeDatatypeValue(
							chars,
							datatype,
							elementContext.namespaceID, elementContext.localNameID);
			// update current element context with revised grammar
			var nextGrammar = grammars.grs.grammar[prod.nextGrammarID];
			this.elementContext[this.elementContext.length - 1].grammar = nextGrammar;
		} else {
			throw new Error("No characters event found for '" + chars + "'");
		}
	}
	
	function decimalPlaces(num) {
		  var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
		  if (!match) { return 0; }
		  return Math.max(
		       0,
		       // Number of digits right of decimal point.
		       (match[1] ? match[1].length : 0)
		       // Adjust for scientific notation.
		       - (match[2] ? +match[2] : 0));
	}
	
	Number.isInteger = Number.isInteger || function(value) {
	    return typeof value === "number" && 
	           isFinite(value) && 
	           Math.floor(value) === value;
	};
	
	
	// inspired by https://blog.coolmuse.com/2012/06/21/getting-the-exponent-and-mantissa-from-a-javascript-number/
	function getEXIFloat(value) {
		if (typeof value !== "number") {
			throw new TypeError("value must be a Number");
		}
		var result = {
			exponent : 0,
			mantissa : 0
		};
		
		if ( value === 0 ) {
		    return result;
		}
		
		if ( Number.isInteger(value) ) {
			result.mantissa = value;
			return result;
		}
		
		// not finite?
		if (!isFinite(value)) {
			result.exponent = -16384;
			if (isNaN(value)) {
				result.mantissa = 0;
			} else {
				if (value === -Infinity) {
					result.mantissa = -1;
				} else {
					result.mantissa = +1;
				}
			}
			return result;
		}
		
		// value = (Number(value)).doubleValue();
		value = Number(Number(value).toFixed(6)); // at most 6 digits
		
		
		// negative?
		var isNegative = false;
		if ( value < 0 ) {
			isNegative = true;
			value = -value;
		}
		
		var dp = decimalPlaces(value);
		
		// calculate exponent
		if(dp > 0) {
			result.exponent = -dp;
		}
		
		// calculate mantissa
		var m = value;
		while(dp > 0) {
			m = m * 10;
			dp -= 1;
		}
		result.mantissa = Math.round(m);
  
		if ( isNegative ) {
			result.mantissa = -result.mantissa;
		}
		
		return result;
	}

	/*
	function equalFloat(f1, f2) {
		return ((f1 > f2 ? f1 - f2 : f2 - f1) < (1e-4));
	}
	*/

	function DateTimeValue() {
		this.year;
		this.monthDay;
		this.error = 0;
	}

	function parseYear(sb, dateTimeValue) {
		var sYear;
		var len;
		if (sb.charAt(0) === '-') {
			sYear = sb.substring(0, 5);
			len = 5;
		} else {
			sYear = sb.substring(0, 4);
			len = 4;
		}
		var year = parseInt(sYear);
		dateTimeValue.year = year;

		return len;
	}

	/*
	 * function parseMonth(sb, pos, dateTimeValue) { var month =
	 * parseInt(sb.substring(pos, pos+2)); // adjust buffer // sb.delete(0, 2);
	 * sb = sb.substring(pos+ 2);
	 * 
	 * return month; }
	 */
	/*
	 * function parseDay(sb, pos) { var sDay = sb.substring(pos, pos+2); var day =
	 * parseInt(sDay); return (pos+2); }
	 */

	function checkCharacter(sb, pos, c, dateTimeValue) {
		if (sb.length > pos && sb.charAt(pos) === c) {
			// ok
		} else {
			dateTimeValue.error = -1;
		}

		return (pos + 1)
	}

	function parseMonthDay(sb, pos, dateTimeValue) {
		// pos = parseMonth(sb, pos, dateTimeValue); // month
		var month = parseInt(sb.substring(pos, pos + 2));
		pos += 2;
		pos = checkCharacter(sb, pos, '-', dateTimeValue); // hyphen
		// var day = parseDay(sb); // day
		var day = parseInt(sb.substring(pos, pos + 2));
		pos += 2;

		// MONTH_MULTIPLICATOR == 32
		dateTimeValue.monthDay = month * 32 + day;
		return pos;
	}

	EXIEncoder.prototype.encodeDatatypeValue = function(value, datatype,
			namespaceID, localNameID) {
		if (datatype.type === "STRING") {
			this.encodeDatatypeValueString(value, namespaceID, localNameID);
		} else if (datatype.type === "UNSIGNED_INTEGER") {
			this.encodeDatatypeValueUnsignedInteger(value, namespaceID, localNameID);
		} else if (datatype.type === "INTEGER") {
			this.encodeDatatypeValueInteger(value, namespaceID, localNameID);
		} else if (datatype.type === "FLOAT") {
			this.encodeDatatypeValueFloat(value, namespaceID, localNameID);
		} else if (datatype.type === "BOOLEAN") {
			this.encodeDatatypeValueBoolean(value, namespaceID, localNameID);
		} else if (datatype.type === "DATETIME") {
			this.encodeDatatypeValueDateTime(value, datatype.datetimeType, namespaceID, localNameID);
		} else if (datatype.type === "LIST") {
			var resArray = value.split(" ");
			this.bitStream.encodeUnsignedInteger(resArray.length);
			console.log("\t" + " LIST with length " + resArray.length + ": " + resArray);
			for(var i=0; i <  resArray.length; i++) {
				var v = resArray[i];
				if (datatype.listType === "STRING") {
					this.encodeDatatypeValueString(v, namespaceID, localNameID);
				} else if (datatype.listType === "UNSIGNED_INTEGER") {
					this.encodeDatatypeValueUnsignedInteger(v, namespaceID, localNameID);
				} else if (datatype.listType === "INTEGER") {
					this.encodeDatatypeValueInteger(v, namespaceID, localNameID);
				} else if (datatype.listType === "FLOAT") {
					this.encodeDatatypeValueFloat(v, namespaceID, localNameID);
				} else if (datatype.listType === "BOOLEAN") {
					this.encodeDatatypeValueBoolean(v, namespaceID, localNameID);
				} else {
					throw new Error("Unsupported list datatype: " + datatype.listType + " for value " + value );
				}		
			}
		} else {
			throw new Error("Unsupported datatype: " + datatype.type + " for value " + value );
		}
	}

	
	EXIEncoder.prototype.encodeDatatypeValueString = function(value, namespaceID, localNameID) {
		var stEntry = this.stringTable.getStringTableEntry(value);
		if (stEntry === null) {
			// miss
			var slen = value.length;
			this.bitStream.encodeUnsignedInteger(2 + slen);
			// TODO characters
			if (slen > 0) {
				this.bitStream.encodeStringOnly(value);
				this.stringTable.addValue(namespaceID, localNameID, value);
			}
		} else {
			if (stEntry.namespaceID === namespaceID && stEntry.localNameID === localNameID) {
				// local hit
				this.bitStream.encodeUnsignedInteger(0);
				var n = this.getCodeLength(this.stringTable
						.getNumberOfLocalStrings(namespaceID, localNameID));
				this.bitStream.encodeNBitUnsignedInteger(
						stEntry.localValueID, n);
			} else {
				// global hit
				this.bitStream.encodeUnsignedInteger(1);
				var n = this.getCodeLength(this.stringTable
						.getNumberOfGlobalStrings());
				this.bitStream.encodeNBitUnsignedInteger(
						stEntry.globalValueID, n);
			}
		}
	}
	
	EXIEncoder.prototype.encodeDatatypeValueUnsignedInteger = function(value, namespaceID, localNameID) {
		console.log("\t" + " UNSIGNED_INTEGER = " + value);
		this.bitStream.encodeUnsignedInteger(value);
	}
	
	EXIEncoder.prototype.encodeDatatypeValueInteger = function(value, namespaceID, localNameID) {
		console.log("\t" + " INTEGER = " + value);
		this.bitStream.encodeInteger(value);
	}
	
	EXIEncoder.prototype.encodeDatatypeValueFloat = function(value, namespaceID, localNameID) {
		var f = parseFloat(value);
		// 
		console.log("\t" + " floatA = " + f);
		// var fl = decodeIEEE64(f);
		// var fl = getNumberParts(f);
		var fl = getEXIFloat(f);
		// mantissa followed by exponent
		this.bitStream.encodeInteger(fl.mantissa);
		this.bitStream.encodeInteger(fl.exponent);
		console
				.log("\t" + " floatB = " + fl.mantissa + " E "
						+ fl.exponent);
	}
	
	EXIEncoder.prototype.encodeDatatypeValueBoolean = function(value, namespaceID, localNameID) {
		if (value) { // == "true" || value == "1"
			this.bitStream.encodeNBitUnsignedInteger(1, 1);
		} else {
			this.bitStream.encodeNBitUnsignedInteger(0, 1);
		}
	}
	
	EXIEncoder.prototype.encodeDatatypeValueDateTime = function(value, datetimeType, namespaceID, localNameID) {
		var year = 0, monthDay = 0, time = 0, fractionalSecs = 0;
		var presenceFractionalSecs = false;
		var presenceTimezone = false;
		var sDatetime = "";
		if (datetimeType === "date") { // // date: Year, MonthDay,
			// [TimeZone]
			// YEAR_OFFSET = 2000
			// NUMBER_BITS_MONTHDAY = 9
			// MONTH_MULTIPLICATOR = 32
			var dateTimeValue = new DateTimeValue();
			var pos = parseYear(value, dateTimeValue);
			pos = checkCharacter(value, pos, '-', dateTimeValue); // hyphen
			pos = parseMonthDay(value, pos, dateTimeValue);
			// TODO timezone
			this.bitStream.encodeInteger(dateTimeValue.year - 2000);
			this.bitStream.encodeNBitUnsignedInteger(
					dateTimeValue.monthDay, 9);
		} else {
			throw new Error("Unsupported datetime type: " + datetimeType);
		}

		var presenceTimezone = false; // TODO
		if (presenceTimezone) {
			this.bitStream.encodeNBitUnsignedInteger(1, 1);
			throw new Error("Unsupported datetime timezone");
		} else {
			this.bitStream.encodeNBitUnsignedInteger(0, 1);
		}
		// console.log("\t" + " presenceTimezone = " + presenceTimezone);
		console.log("\t" + " datetime = " + sDatetime);
	}

}
