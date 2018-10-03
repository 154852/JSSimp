# JSSimp

JSSimp is a simple library to - as the name suggests - simplify javascript, it allows you to get user input for example, withut handling any HTML - we do this bit for you!

Our documentation can be find in the 'Wiki' section.

## An Example
-Taken from the tests directory
```
<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>Basic Test</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="../src/main.js"></script>

        <style>
            html, body {
                height: 100%;
                margin: 0;
            }
        </style>
    </head>
    <body>
    </body>
    <script>
        const ctx = simpler(async function() {
            console.log('What is your name?');
            console.log('Hello ' + (await this.ctx.input()) + '!');
        });
    </script>
</html>
```
Easy.
