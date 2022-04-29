FROM elixir
WORKDIR /app
COPY . .
RUN mkdir /socket
RUN touch /socket/api.sock
RUN chmod 600 /socket/api.sock
RUN groupadd -g 999 elixir && useradd -m -r -u 999 -g elixir elixir
RUN chown -R elixir:elixir .
RUN chown elixir:elixir /socket/api.sock
USER elixir
RUN mix deps.get
CMD ["mix", "run", "--no-halt"]