# This is for another service, such as a dashboard, to modify and retrieve settings. It is not made to be a public api.

defmodule APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  plug(Plug.TokenAuth)

  plug(Plug.Parsers,
    parsers: [:json],
    json_decoder: Jason
  )

  plug(:match)
  plug(:dispatch)

  defp respond(conn, doc) do
    {status, body} =
      cond do
        is_tuple(doc) -> {500, "{\"error\":\"Failed to perform action\"}"}
        is_nil(doc) or map_size(doc) === 0 -> {404, "{\"error\":\"Not found\"}"}
        true -> {200, Jason.encode!(doc)}
      end

    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, body)
    |> halt
  end

  get "/guild/:id/binds" do
    respond(
      conn,
      Mongo.find(:mongo, "binds", %{server: id}, projection: %{_id: 0})
    )
  end

  get "/guild/:id/binds/:bind" do
    respond(
      conn,
      Mongo.find_one(:mongo, "binds", %{server: id, id: bind}, projection: %{_id: 0})
    )
  end

  get "/guild/:id/ignored" do
    respond(
      conn,
      Mongo.find(:mongo, "ignored", %{guild: id}, projection: %{_id: 0})
    )
  end

  get "/guild/:id/ignored/:channel" do
    respond(
      conn,
      Mongo.find_one(:mongo, "ignored", %{guild: id, channel: channel}, projection: %{_id: 0})
    )
  end

  get "/guild/:id/settings" do
    respond(
      conn,
      Mongo.find_one(:mongo, "settings", %{guild: id}, projection: %{_id: 0})
    )
  end

  get "/guild/:id/settings/:setting" do
    respond(
      conn,
      Mongo.find_one(:mongo, "settings", %{guild: id}, projection: %{"#{setting}": 1, _id: 0})
    )
  end

  match _ do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(404, "{\"error\":\"Not found\"}")
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{kind: _kind, reason: _reason, stack: _stack}) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(500, "{\"error\":\"Internal server error\"}")
  end
end
