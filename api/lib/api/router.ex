# This is for another service, such as a dashboard, to modify and retrieve settings. It is not made to be a public api.

defmodule APIRouter do
  use Plug.Router
  use Plug.ErrorHandler

  plug(Plug.TokenAuth)
  plug(Plug.UpdateBSONValidator)

  plug(Plug.Parsers,
    parsers: [:json],
    json_decoder: Jason
  )

  plug(:match)
  plug(:dispatch)

  defp respond(conn, status, body) do
    conn
    |> put_resp_content_type("application/json")
    |> send_resp(status, Jason.encode!(body))
    |> halt
  end

  get "/guild/:id" do
    doc = Mongo.find_one(:mongo, "settings", %{guild: id})

    {status, body} =
      cond do
        is_tuple(doc) -> {500, %{error: "Failed to fetch guild settings"}}
        is_nil(doc) -> {404, %{error: "No settings found for guild"}}
        true -> {200, Map.delete(doc, "_id")}
      end

    respond(conn, status, body)
  end

  match _ do
    respond(conn, 404, %{error: "Not found"})
  end

  @impl Plug.ErrorHandler
  def handle_errors(conn, %{kind: _kind, reason: _reason, stack: _stack}) do
    respond(conn, 500, %{error: "Internal server error"})
  end
end
