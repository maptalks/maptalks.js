SET SourceDir=%1
FOR /R %SourceDir% %%A IN ("*.gz") DO 7z x "%%~A" -o"%%~pA\"
FOR /R %SourceDir% %%A IN ("*.gz") DO del %%~A
