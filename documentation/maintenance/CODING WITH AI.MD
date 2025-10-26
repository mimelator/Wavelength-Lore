DON'T MAKE ME MANUALLY VALIDATE YOUR CODE AND FIXES. RIGHT BETTER TESTS. WITH BETTER VALIDATION.

STOP RUNNING NODE.JS IN THE FOREGROUND YOU KILL IT EVERYTIME WITH SUBSEQUENT COMMANDS.
STOP HIDING THE LOGS WHEN RUNNING THE SERVER OR TESTS.  I CAN'T SEE THEM AND HAVE NO CLUE WHAT YOU ARE TRYING TO ACCOMPLISH.

Run our FULL VALIDATION Regression Suite at once not individually.
SCAN THE LIVE CONSOLE OUTPUT LOOKING FOR ERRORS AND VALIDATION. 
DON'T JUST WAIT FOR TEST COMPLETION AND THEN HUNT FOR LOGS AND INFO LATER.
If you find a bug, BEFORE FIXING:
BUILD/EHNANCE THE TEST
RUN THE TEST
FIX THE CODE
RUN THE TEST


Have you Exposed any Secrets?
Are you bypassing the APIs which prevents us from hardening the production code and makes our code base more fragile?
Have you implemented sufficient Validation for the recent changes?
Does the runtime need more validation and logging?
Is there code refactoring that should happen to help prevent these bugs in the future?  eg: Signature, datatype, construtor, method calling mismatches?
Are you reusing helper function or reinventing the wheel?
What happens when your script is ran twice?  Will it fail the second time?

REMOVE ALL THE UNNEEDED TESTS, UPDATE SCRIPTS AND DEBUG SCRIPTS THAT ARE TRANSEIENT AND NOT NEEDED ANYMORE.