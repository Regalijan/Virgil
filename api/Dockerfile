FROM elixir
WORKDIR /app
COPY . .
RUN touch /socket/api.sock
RUN groupadd -g 999 elixir && useradd -m -r -u 999 -g elixir elixir
RUN chown -R elixir:elixir .
USER elixir
RUN mix deps.get
CMD ["mix", "run", "--no-halt"]